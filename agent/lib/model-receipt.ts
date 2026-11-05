// Project receipt identities for the model without classifying evidence or editing submissions.
export function modelReceipt(receipt:any){
 const payload=receipt.payload;
 const reference_options=[
  ...(payload.records||[]).filter((r:any)=>Object.hasOwn(r,'state')).map((r:any)=>({receipt_id:receipt.id,evidence_id:r.evidence_id,field:'state'})),
  ...(payload.catalogs||[]).map((c:any)=>({receipt_id:receipt.id,evidence_id:'catalog_'+c.group,field:'catalog_complete'}))
 ];
 return {receipt_id:receipt.id,...payload,reference_options};
}
