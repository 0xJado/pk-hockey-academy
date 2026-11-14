/** Explicit build decision, separate from indexing and private PHP activation. */
export function registrationFormEnabled(env: Record<string,string|undefined>, policy: {status:string;publicIntakeEnabled:boolean}): boolean {
  const flag=env.PUBLIC_REGISTRATION_ENABLED?.trim()||"false";
  if(!["true","false"].includes(flag))throw new Error("Invalid registration build flag.");
  if(flag!=="true")return false;
  if(env.DEPLOY_TARGET!=="strato"||policy.status!=="approved"||policy.publicIntakeEnabled!==true)
    throw new Error("Registration requires the accepted STRATO request policy.");
  return true;
}
