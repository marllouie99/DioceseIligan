(function(){
  const tabSignin = document.getElementById('tab-signin');
  const tabSignup = document.getElementById('tab-signup');
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');
  const linkSignup = document.getElementById('link-signup');
  const linkSignin = document.getElementById('link-signin');
  const heading = document.getElementById('heading-title');

  function setActive(tab){
    if(!tabSignin || !tabSignup || !signinForm || !signupForm) return;
    if(tab === 'signup'){
      tabSignin.classList.remove('active');
      tabSignup.classList.add('active');
      signinForm.style.display = 'none';
      signupForm.style.display = 'block';
      if (heading) heading.textContent = 'Create your account';
      const first = signupForm.querySelector('input');
      if (first) first.focus();
    } else {
      tabSignin.classList.add('active');
      tabSignup.classList.remove('active');
      signinForm.style.display = 'block';
      signupForm.style.display = 'none';
      if (heading) heading.textContent = 'Welcome to ChurchConnect';
      
      // Reset progressive login state when switching to sign in
      resetProgressiveLoginState();
      
      const first = signinForm.querySelector('#signin-email');
      if (first) first.focus();
    }
  }

  // Reset progressive login to initial email step
  function resetProgressiveLoginState(){
    const emailStep = document.getElementById('email-step');
    const loginOptionsStep = document.getElementById('login-options-step');
    const signinEmail = document.getElementById('signin-email');
    const signinPassword = document.getElementById('signin-password');
    
    if (emailStep && loginOptionsStep) {
      emailStep.style.display = 'block';
      loginOptionsStep.style.display = 'none';
    }
    
    // Clear form fields
    if (signinEmail) signinEmail.value = '';
    if (signinPassword) signinPassword.value = '';
  }

  if (tabSignin) tabSignin.addEventListener('click', function(){ setActive('signin'); });
  if (tabSignup) tabSignup.addEventListener('click', function(){ setActive('signup'); });
  if (linkSignup) linkSignup.addEventListener('click', function(e){ e.preventDefault(); setActive('signup'); });
  if (linkSignin) linkSignin.addEventListener('click', function(e){ e.preventDefault(); setActive('signin'); });

  // Password visibility toggles
  function setupPasswordToggles(){
    document.querySelectorAll('.password-toggle').forEach(function(btn){
      btn.addEventListener('click', function(){
        const container = btn.closest('.input');
        if(!container) return;
        const input = container.querySelector('input[type="password"], input[type="text"]');
        if(!input) return;
        if(input.type === 'password'){
          input.type = 'text';
          btn.textContent = '🙈';
        } else {
          input.type = 'password';
          btn.textContent = '👁';
        }
      });
    });
  }

  setupPasswordToggles();

  // Progressive Login Flow
  function setupProgressiveLogin(){
    const emailStep = document.getElementById('email-step');
    const loginOptionsStep = document.getElementById('login-options-step');
    const emailContinueBtn = document.getElementById('email-continue-btn');
    const goBackBtn = document.getElementById('go-back-btn');
    const signinEmail = document.getElementById('signin-email');
    const displayedEmail = document.getElementById('displayed-email');
    const emailCodeBtn = document.getElementById('email-code-btn');
    const signinPassword = document.getElementById('signin-password');

    if (!emailContinueBtn || !emailStep || !loginOptionsStep) return;

    // Continue button - show login options
    emailContinueBtn.addEventListener('click', function(){
      const email = signinEmail.value.trim();
      
      if (!email) {
        signinEmail.focus();
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        signinEmail.focus();
        return;
      }
      
      // Store email and show login options
      displayedEmail.textContent = email;
      emailStep.style.display = 'none';
      loginOptionsStep.style.display = 'block';
      
      // Focus password field for convenience
      if (signinPassword) {
        signinPassword.focus();
      }
    });

    // Go back button - return to email step
    if (goBackBtn) {
      goBackBtn.addEventListener('click', function(){
        loginOptionsStep.style.display = 'none';
        emailStep.style.display = 'block';
        signinEmail.focus();
      });
    }

    // Email code button - redirect to login with code
    if (emailCodeBtn) {
      emailCodeBtn.addEventListener('click', function(){
        const email = signinEmail.value.trim();
        // Redirect to login with code page with email pre-filled
        window.location.href = '/accounts/login-with-code/?email=' + encodeURIComponent(email);
      });
    }

    // Allow Enter key to continue from email step
    if (signinEmail) {
      signinEmail.addEventListener('keypress', function(e){
        if (e.key === 'Enter') {
          e.preventDefault();
          emailContinueBtn.click();
        }
      });
    }
  }

  setupProgressiveLogin();

})();
