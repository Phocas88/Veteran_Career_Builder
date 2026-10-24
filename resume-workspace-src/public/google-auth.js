// Use Firebase's named app and official provider flow. No OAuth tokens are stored here.
export const isGuestAccount=user=>!!user&&!user.email;
export function beginGooglePopup(connection,{linkCurrent=false,switchFromGuest=false}={}){
 const {auth,firebase}=connection,provider=new firebase.auth.GoogleAuthProvider();
 provider.setCustomParameters({prompt:'select_account'});
 // Invoke synchronously from the click handler so mobile browsers retain the user gesture.
 if(linkCurrent&&!auth.currentUser)throw Object.assign(new Error('Sign in again'),{code:'auth/user-mismatch'});
 if(linkCurrent||isGuestAccount(auth.currentUser)&&!switchFromGuest)return auth.currentUser.linkWithPopup(provider);
 return auth.signInWithPopup(provider);
}
export function googleErrorMessage(error){
 const code=error?.code||'';
 if(/popup-closed-by-user|cancelled-popup-request/.test(code))return 'Google sign-in was cancelled. Your current work is unchanged.';
 if(/popup-blocked/.test(code))return 'Allow pop-ups for this site, then try Google again. If this app is inside TikTok or LinkedIn, open it in Chrome or Safari. Save or download guest work before changing browsers.';
 if(/operation-not-allowed|configuration-not-found/.test(code))return 'Google sign-in is not enabled for this app yet. Use email sign-in or continue as a guest.';
 if(/unauthorized-domain/.test(code))return 'Google sign-in is not configured for this website address. Use the main app at veterancareerpath.com/resumereview or sign in with email.';
 if(/account-exists-with-different-credential/.test(code))return 'This email already has an account with another sign-in method. Sign in with that method first, then choose Link Google in Account. Your guest work and purchases have not been moved.';
 if(/credential-already-in-use/.test(code))return 'This Google account already belongs to an existing account. Your guest session is unchanged. Keep using this guest session, choose a different Google account, or switch accounts after saving or downloading your guest work.';
 if(/provider-already-linked/.test(code))return 'Google is already linked to this account.';
 if(/requires-recent-login|user-mismatch/.test(code))return 'Sign in to your account again before linking Google. Your saved work is unchanged.';
 if(/network-request-failed/.test(code))return 'Google sign-in could not connect. Check your connection and try again. Your current work is unchanged.';
 if(/web-storage-unsupported|operation-not-supported-in-this-environment/.test(code))return 'This browser cannot complete Google sign-in. Use Chrome or Safari, or sign in with email. Save or download guest work before changing browsers.';
 return 'Google sign-in could not finish. Try again or use email sign-in. Your current draft is unchanged.';
}
export function startsProfileSetup(result,guestBefore){return result?.additionalUserInfo?.isNewUser===true||!!guestBefore&&result?.user?.uid===guestBefore;}
