-- Función para eliminar ofertas de subcontrato, incluyendo ofertas ganadoras
CREATE OR REPLACE FUNCTION delete_subcontract_bid(bid_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Primero, limpiar cualquier referencia de subcontrato que use esta oferta como ganadora
  UPDATE subcontracts 
  SET winner_bid_id = NULL, status = 'active'
  WHERE winner_bid_id = bid_id;
  
  -- Luego eliminar la oferta
  DELETE FROM subcontract_bids WHERE id = bid_id;
END;
$$;