import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_ENV || 'sandbox';

const PAYPAL_BASE_URL = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.error('Missing PayPal credentials (PAYPAL_CLIENT_ID, PAYPAL_SECRET)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  return data.access_token;
}

async function createProduct(name: string, description: string) {
  const token = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
    body: JSON.stringify({ name, description, type: 'SERVICE', category: 'SOFTWARE' }),
  });
  return response.json();
}

async function createBillingPlan(productId: string, name: string, amount: number, interval: 'MONTH' | 'YEAR') {
  const token = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      description: `${name} subscription`,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: { interval_unit: interval, interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: String(amount), currency_code: 'USD' } },
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });
  return response.json();
}

async function main() {
  console.log(`\n🔄 Syncing plans with PayPal (${PAYPAL_MODE} mode)...\n`);

  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, name, slug, monthly_amount, annual_amount, is_active, paypal_product_id, paypal_plan_monthly_id, paypal_plan_annual_id')
    .eq('is_active', true)
    .neq('slug', 'free');

  if (error || !plans) {
    console.error('Error fetching plans:', error);
    return;
  }

  console.log(`Found ${plans.length} active paid plans\n`);

  for (const plan of plans) {
    console.log(`\n📦 Processing: ${plan.name} (${plan.slug})`);
    
    let productId = plan.paypal_product_id;
    let monthlyPlanId = plan.paypal_plan_monthly_id;
    let annualPlanId = plan.paypal_plan_annual_id;

    // Create product if needed
    if (!productId) {
      console.log('  Creating PayPal product...');
      const product = await createProduct(`Seencel ${plan.name}`, `Subscription for Seencel ${plan.name}`);
      if (product.id) {
        productId = product.id;
        console.log(`  ✅ Product created: ${productId}`);
      } else {
        console.log(`  ❌ Failed to create product:`, product);
        continue;
      }
    } else {
      console.log(`  ✅ Product exists: ${productId}`);
    }

    // Create monthly plan if needed
    if (!monthlyPlanId && plan.monthly_amount > 0) {
      console.log('  Creating monthly billing plan...');
      const monthlyPlan = await createBillingPlan(productId, `${plan.name} Monthly`, plan.monthly_amount, 'MONTH');
      if (monthlyPlan.id) {
        monthlyPlanId = monthlyPlan.id;
        console.log(`  ✅ Monthly plan created: ${monthlyPlanId}`);
      } else {
        console.log(`  ❌ Failed to create monthly plan:`, monthlyPlan);
      }
    } else if (monthlyPlanId) {
      console.log(`  ✅ Monthly plan exists: ${monthlyPlanId}`);
    }

    // Create annual plan if needed
    if (!annualPlanId && plan.annual_amount > 0) {
      console.log('  Creating annual billing plan...');
      const annualPlan = await createBillingPlan(productId, `${plan.name} Annual`, plan.annual_amount, 'YEAR');
      if (annualPlan.id) {
        annualPlanId = annualPlan.id;
        console.log(`  ✅ Annual plan created: ${annualPlanId}`);
      } else {
        console.log(`  ❌ Failed to create annual plan:`, annualPlan);
      }
    } else if (annualPlanId) {
      console.log(`  ✅ Annual plan exists: ${annualPlanId}`);
    }

    // Update database
    const { error: updateError } = await supabase
      .from('plans')
      .update({
        paypal_product_id: productId,
        paypal_plan_monthly_id: monthlyPlanId,
        paypal_plan_annual_id: annualPlanId,
      })
      .eq('id', plan.id);

    if (updateError) {
      console.log(`  ❌ Failed to update database:`, updateError);
    } else {
      console.log(`  ✅ Database updated`);
    }
  }

  console.log('\n✅ Sync complete!\n');
}

main().catch(console.error);
