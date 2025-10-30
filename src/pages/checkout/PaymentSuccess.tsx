export default function PaymentSuccess() {
  console.log('=== PAYMENT SUCCESS PAGE LOADED ===');
  
  const urlParams = new URLSearchParams(window.location.search);
  const courseSlug = urlParams.get('course_slug');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-2xl w-full bg-green-50 p-8 rounded-lg border-2 border-green-500">
        <h1 className="text-4xl font-bold text-green-600 mb-4">¡PAGO EXITOSO!</h1>
        <p className="text-xl">Curso: {courseSlug}</p>
        <p className="text-lg mt-4">Esta es la nueva página de éxito.</p>
        <a href={`/learning/courses/${courseSlug}`} className="mt-6 inline-block bg-green-600 text-white px-6 py-3 rounded-lg">
          IR AL CURSO
        </a>
      </div>
    </div>
  );
}
