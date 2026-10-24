-- PRD 14: PDF QR for Celebration/Signature. Existing order/event snapshots are immutable.
-- Older deployments stored the plan JSON as a JSON string; normalize before editing it.
UPDATE plans SET config=(config#>>'{}')::jsonb WHERE jsonb_typeof(config)='string';
INSERT INTO audit(id,action,detail)
SELECT gen_random_uuid(),'catalog.qr_pdf_entitlement',jsonb_build_object('planId',id,'previousVersion',version,'previousConfig',config,'qrPdf',id IN ('celebration','signature'))
FROM plans WHERE NOT (config ? 'qrPdf');
UPDATE plans SET config=jsonb_set(config,'{qrPdf}',to_jsonb(id IN ('celebration','signature'))),version=version+1
WHERE NOT (config ? 'qrPdf');
