const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ARTIFACT_DIR = 'C:\\Users\\Catriona\\.gemini\\antigravity-ide\\brain\\17aee37c-cf82-4b47-aead-f5733e3730e6';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickElementByText(page, textPredicate, roleSelector = 'div[tabindex="0"], div[role="button"], button, a') {
  const box = await page.evaluate((predText, sel) => {
    const els = Array.from(document.querySelectorAll(sel));
    const target = els.find((el) => {
      const txt = (el.innerText || el.textContent || '').trim();
      return txt === predText || (txt.includes(predText) && !txt.includes('Demo'));
    });
    if (!target) return null;
    target.scrollIntoView({ behavior: 'instant', block: 'center' });
    const rect = target.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, textPredicate, roleSelector);

  if (box) {
    await page.mouse.click(box.x, box.y);
    return true;
  }
  return false;
}

async function runVerification() {
  console.log('🚀 Starting MedLink Unified Splash-First Full Validation...');
  console.log(`Using Chrome binary at: ${CHROME_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const results = {};

  try {
    // ========================================================
    // 1. CLINIC ASSISTANT VERIFICATION
    // ========================================================
    console.log('\n==================================================');
    console.log('📋 1. TESTING CLINIC ASSISTANT (http://localhost:5173)');
    console.log('==================================================');
    const pageClinic = await browser.newPage();
    pageClinic.on('dialog', async (dialog) => { await dialog.accept(); });

    // 1A. Start clean / logged out
    await pageClinic.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await pageClinic.evaluate(() => localStorage.clear());
    await pageClinic.reload({ waitUntil: 'domcontentloaded' });

    // Step 1: Confirm Splash appears first
    await sleep(250);
    let clinicContent = await pageClinic.content();
    results['clinic_launch_splash'] = clinicContent.includes('MEDLINK') && clinicContent.includes('Connecting you to care...');
    console.log(`1. Confirm Splash appears: ${results['clinic_launch_splash'] ? '✅ PASS' : '❌ FAIL'}`);
    await pageClinic.screenshot({ path: path.join(ARTIFACT_DIR, 'clinic_01_splash.png') });

    // Step 2: Confirm Login appears after splash
    await sleep(1500);
    clinicContent = await pageClinic.content();
    results['clinic_launch_login'] = clinicContent.includes('Receptionist Sign In') || clinicContent.includes('ASSISTANT WORK EMAIL') || clinicContent.includes('Proceed to OTP Verification');
    console.log(`2. Confirm Login appears after splash: ${results['clinic_launch_login'] ? '✅ PASS' : '❌ FAIL'}`);
    await pageClinic.screenshot({ path: path.join(ARTIFACT_DIR, 'clinic_02_login.png') });

    // Step 3: Login + OTP
    // Expand Demo Drawer & click Sheryl Thomas
    await pageClinic.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div, button, span'));
      const demoBtn = allDivs.find((d) => d.textContent && (d.textContent.includes('Demo Assistant Accounts') || d.textContent.includes('Demo Accounts')));
      if (demoBtn) demoBtn.click();
    });
    await sleep(400);

    await pageClinic.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div, button, span'));
      const sheryl = allDivs.find((d) => d.textContent && d.textContent.includes('Sheryl Thomas') && (d.textContent.includes('Auto-Fill') || d.textContent.includes('Moon Dental')));
      if (sheryl) sheryl.click();
    });
    await sleep(300);

    // Click Sign In / Proceed to OTP Verification
    await pageClinic.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const proceedBtn = allButtons.find((b) => b.textContent && (b.textContent.includes('Proceed to OTP Verification') || b.type === 'submit'));
      if (proceedBtn) proceedBtn.click();
    });
    await sleep(1000);

    // Verify OTP auto-fill & verify
    await pageClinic.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const verifyBtn = allButtons.find((b) => b.textContent && (b.textContent.includes('Verify & Access') || b.textContent.includes('Verify')));
      if (verifyBtn) verifyBtn.click();
    });
    await sleep(1500);

    // Step 4: Confirm Dashboard, assistant name, clinic name
    clinicContent = await pageClinic.content();
    results['clinic_dashboard_auth'] = clinicContent.includes('Sheryl Thomas') && clinicContent.includes('Moon Dental');
    console.log(`3. Confirm Dashboard opens (Assistant: Sheryl Thomas, Clinic: Moon Dental): ${results['clinic_dashboard_auth'] ? '✅ PASS' : '❌ FAIL'}`);
    await pageClinic.screenshot({ path: path.join(ARTIFACT_DIR, 'clinic_03_dashboard.png') });

    // Step 5: Refresh
    console.log('[Clinic] Refreshing page...');
    await pageClinic.reload({ waitUntil: 'domcontentloaded' });
    await sleep(250);
    const refreshSplashClinic = await pageClinic.content();
    results['clinic_refresh_splash'] = refreshSplashClinic.includes('MEDLINK') && refreshSplashClinic.includes('Connecting you to care...');
    console.log(`4. Confirm Splash on Refresh: ${results['clinic_refresh_splash'] ? '✅ PASS' : '❌ FAIL'}`);

    // Step 6: Confirm session restoration
    await sleep(1500);
    const refreshContentClinic = await pageClinic.content();
    results['clinic_refresh_session_restored'] = refreshContentClinic.includes('Sheryl Thomas') && refreshContentClinic.includes('Moon Dental');
    console.log(`5. Confirm Session Restores to Dashboard: ${results['clinic_refresh_session_restored'] ? '✅ PASS' : '❌ FAIL'}`);

    // Step 7: Logout
    console.log('[Clinic] Clicking Logout...');
    await pageClinic.evaluate(() => {
      const logoutBtn = document.querySelector('button[aria-label="Log Out"], button[title*="Log Out"]');
      if (logoutBtn) logoutBtn.click();
    });
    await sleep(250);
    const logoutSplashClinic = await pageClinic.content();
    results['clinic_logout_splash'] = logoutSplashClinic.includes('MEDLINK') && logoutSplashClinic.includes('Connecting you to care...');
    console.log(`6. Confirm Splash on Logout: ${results['clinic_logout_splash'] ? '✅ PASS' : '❌ FAIL'}`);
    await pageClinic.screenshot({ path: path.join(ARTIFACT_DIR, 'clinic_04_logout_splash.png') });

    // Step 8: Confirm Login screen appears
    await sleep(1500);
    const logoutLoginClinic = await pageClinic.content();
    results['clinic_logout_login'] = logoutLoginClinic.includes('Receptionist Sign In') || logoutLoginClinic.includes('ASSISTANT WORK EMAIL');
    console.log(`7. Confirm Login appears after logout: ${results['clinic_logout_login'] ? '✅ PASS' : '❌ FAIL'}`);
    await pageClinic.screenshot({ path: path.join(ARTIFACT_DIR, 'clinic_05_logged_out_login.png') });

    await pageClinic.close();

    // ========================================================
    // 2. PATIENT APP VERIFICATION
    // ========================================================
    console.log('\n==================================================');
    console.log('📋 2. TESTING PATIENT APP (http://localhost:8082)');
    console.log('==================================================');
    const pagePatient = await browser.newPage();
    pagePatient.on('dialog', async (dialog) => { await dialog.accept(); });

    // 2A. Start clean / logged out
    await pagePatient.goto('http://localhost:8082', { waitUntil: 'domcontentloaded' });
    await pagePatient.evaluate(() => localStorage.clear());
    await pagePatient.reload({ waitUntil: 'domcontentloaded' });

    // Step 1: Confirm Splash appears
    await sleep(300);
    let patientContent = await pagePatient.content();
    results['patient_launch_splash'] = patientContent.includes('MEDLINK') && patientContent.includes('Connecting you to care...');
    console.log(`1. Confirm Splash appears: ${results['patient_launch_splash'] ? '✅ PASS' : '❌ FAIL'}`);
    await pagePatient.screenshot({ path: path.join(ARTIFACT_DIR, 'patient_01_splash.png') });

    // Step 2: Confirm Login appears after splash
    await sleep(1600);
    patientContent = await pagePatient.content();
    results['patient_launch_login'] = patientContent.includes('Welcome Back') || patientContent.includes('Sign in to manage your appointments');
    console.log(`2. Confirm Login appears after splash: ${results['patient_launch_login'] ? '✅ PASS' : '❌ FAIL'}`);
    await pagePatient.screenshot({ path: path.join(ARTIFACT_DIR, 'patient_02_login.png') });

    // Step 3: Login with credentials
    console.log('[Patient] Typing credentials into Login...');
    await pagePatient.waitForSelector('input[placeholder="name@example.com"]');
    await pagePatient.click('input[placeholder="name@example.com"]');
    await pagePatient.type('input[placeholder="name@example.com"]', 'patient01@demo.medlink.test', { delay: 20 });

    await pagePatient.waitForSelector('input[placeholder="Enter your password"]');
    await pagePatient.click('input[placeholder="Enter your password"]');
    await pagePatient.type('input[placeholder="Enter your password"]', 'Demo@1001', { delay: 20 });
    await sleep(400);

    // Click Sign In button
    await clickElementByText(pagePatient, 'Sign In');
    await sleep(2500);

    // Step 4: Confirm Patient Home
    patientContent = await pagePatient.content();
    results['patient_home_auth'] = patientContent.includes('Aarav') || patientContent.includes('Upcoming') || patientContent.includes('Specialties') || patientContent.includes('Appointments') || patientContent.includes('Doctor');
    console.log(`3. Confirm Patient Home opens: ${results['patient_home_auth'] ? '✅ PASS' : '❌ FAIL'}`);
    await pagePatient.screenshot({ path: path.join(ARTIFACT_DIR, 'patient_03_home.png') });

    // Step 5: Refresh
    console.log('[Patient] Refreshing page...');
    await pagePatient.reload({ waitUntil: 'domcontentloaded' });
    await sleep(300);
    const refreshSplashPatient = await pagePatient.content();
    results['patient_refresh_splash'] = refreshSplashPatient.includes('MEDLINK') && refreshSplashPatient.includes('Connecting you to care...');
    console.log(`4. Confirm Splash on Refresh: ${results['patient_refresh_splash'] ? '✅ PASS' : '❌ FAIL'}`);

    // Step 6: Confirm Session Restored
    await sleep(1600);
    const refreshContentPatient = await pagePatient.content();
    results['patient_refresh_session_restored'] = refreshContentPatient.includes('Aarav') || refreshContentPatient.includes('Upcoming') || refreshContentPatient.includes('Specialties') || refreshContentPatient.includes('Appointments');
    console.log(`5. Confirm Session Restores to Home: ${results['patient_refresh_session_restored'] ? '✅ PASS' : '❌ FAIL'}`);

    // Step 7: Logout via Profile Tab
    console.log('[Patient] Navigating to Profile & Logging out...');
    await clickElementByText(pagePatient, 'Profile');
    await sleep(1500);

    const loggedOutPatient = await clickElementByText(pagePatient, 'Sign Out');
    if (!loggedOutPatient) {
      await clickElementByText(pagePatient, 'Log Out');
    }
    await sleep(400);

    const logoutSplashPatient = await pagePatient.content();
    results['patient_logout_splash'] = logoutSplashPatient.includes('MEDLINK') && logoutSplashPatient.includes('Connecting you to care...');
    console.log(`6. Confirm Splash on Logout: ${results['patient_logout_splash'] ? '✅ PASS' : '❌ FAIL'}`);
    await pagePatient.screenshot({ path: path.join(ARTIFACT_DIR, 'patient_04_logout_splash.png') });

    await sleep(1600);
    const logoutLoginPatient = await pagePatient.content();
    results['patient_logout_login'] = logoutLoginPatient.includes('Welcome Back') || logoutLoginPatient.includes('Sign in to manage');
    console.log(`7. Confirm Login appears after logout: ${results['patient_logout_login'] ? '✅ PASS' : '❌ FAIL'}`);
    await pagePatient.screenshot({ path: path.join(ARTIFACT_DIR, 'patient_05_logged_out_login.png') });

    await pagePatient.close();

    // ========================================================
    // 3. DOCTOR APP VERIFICATION
    // ========================================================
    console.log('\n==================================================');
    console.log('📋 3. TESTING DOCTOR APP (http://localhost:8083)');
    console.log('==================================================');
    const pageDoctor = await browser.newPage();
    pageDoctor.on('dialog', async (dialog) => { await dialog.accept(); });

    // 3A. Start clean / logged out
    await pageDoctor.goto('http://localhost:8083', { waitUntil: 'domcontentloaded' });
    await pageDoctor.evaluate(() => localStorage.clear());
    await pageDoctor.reload({ waitUntil: 'domcontentloaded' });

    // Step 1: Confirm Splash appears
    await sleep(300);
    let doctorContent = await pageDoctor.content();
    results['doctor_launch_splash'] = doctorContent.includes('MEDLINK') && doctorContent.includes('Connecting you to care...');
    console.log(`1. Confirm Splash appears: ${results['doctor_launch_splash'] ? '✅ PASS' : '❌ FAIL'}`);
    await pageDoctor.screenshot({ path: path.join(ARTIFACT_DIR, 'doctor_01_splash.png') });

    // Step 2: Confirm Login appears after splash
    await sleep(1600);
    doctorContent = await pageDoctor.content();
    results['doctor_launch_login'] = doctorContent.includes('Existing Doctor Sign In') || doctorContent.includes('Sign in to access your authorized clinic schedule');
    console.log(`2. Confirm Login appears after splash: ${results['doctor_launch_login'] ? '✅ PASS' : '❌ FAIL'}`);
    await pageDoctor.screenshot({ path: path.join(ARTIFACT_DIR, 'doctor_02_login.png') });

    // Step 3: Login via credentials
    console.log('[Doctor] Typing credentials into Doctor Login...');
    await pageDoctor.waitForSelector('input[placeholder*="dr.rajesh"]');
    await pageDoctor.click('input[placeholder*="dr.rajesh"]');
    await pageDoctor.type('input[placeholder*="dr.rajesh"]', 'doctor01@demo.medlink.test', { delay: 20 });

    await pageDoctor.waitForSelector('input[placeholder*="confidential"]');
    await pageDoctor.click('input[placeholder*="confidential"]');
    await pageDoctor.type('input[placeholder*="confidential"]', 'Doctor@2001', { delay: 20 });
    await sleep(400);

    // Click Sign In to Workspace
    await clickElementByText(pageDoctor, 'Sign In to Workspace');
    await sleep(2500);

    // Step 4: Confirm Doctor Home / Select Clinic Screen
    doctorContent = await pageDoctor.content();
    results['doctor_home_auth'] = doctorContent.includes('Dr. Arun Kumar') || doctorContent.includes('Select Active Clinic') || doctorContent.includes('Moon Dental') || doctorContent.includes('Sign Out');
    console.log(`3. Confirm Doctor Home opens (Dr. Arun Kumar / Select Clinic): ${results['doctor_home_auth'] ? '✅ PASS' : '❌ FAIL'}`);
    await pageDoctor.screenshot({ path: path.join(ARTIFACT_DIR, 'doctor_03_home.png') });

    // Step 5: Refresh
    console.log('[Doctor] Refreshing page...');
    await pageDoctor.reload({ waitUntil: 'domcontentloaded' });
    await sleep(300);
    const refreshSplashDoctor = await pageDoctor.content();
    results['doctor_refresh_splash'] = refreshSplashDoctor.includes('MEDLINK') && refreshSplashDoctor.includes('Connecting you to care...');
    console.log(`4. Confirm Splash on Refresh: ${results['doctor_refresh_splash'] ? '✅ PASS' : '❌ FAIL'}`);

    // Step 6: Confirm Session Restored
    await sleep(1600);
    const refreshContentDoctor = await pageDoctor.content();
    results['doctor_refresh_session_restored'] = refreshContentDoctor.includes('Dr. Arun Kumar') || refreshContentDoctor.includes('Select Active Clinic') || refreshContentDoctor.includes('Moon Dental') || refreshContentDoctor.includes('Sign Out');
    console.log(`5. Confirm Session Restores to Home: ${results['doctor_refresh_session_restored'] ? '✅ PASS' : '❌ FAIL'}`);

    // Step 7: Logout
    console.log('[Doctor] Clicking Sign Out...');
    await clickElementByText(pageDoctor, 'Sign Out');
    await sleep(300);

    const logoutSplashDoctor = await pageDoctor.content();
    results['doctor_logout_splash'] = logoutSplashDoctor.includes('MEDLINK') && logoutSplashDoctor.includes('Connecting you to care...');
    console.log(`6. Confirm Splash on Logout: ${results['doctor_logout_splash'] ? '✅ PASS' : '❌ FAIL'}`);
    await pageDoctor.screenshot({ path: path.join(ARTIFACT_DIR, 'doctor_04_logout_splash.png') });

    // Step 8: Confirm Doctor Login screen appears
    await sleep(1600);
    const logoutLoginDoctor = await pageDoctor.content();
    results['doctor_logout_login'] = logoutLoginDoctor.includes('Existing Doctor Sign In') || logoutLoginDoctor.includes('Password Login');
    console.log(`7. Confirm Login appears after logout: ${results['doctor_logout_login'] ? '✅ PASS' : '❌ FAIL'}`);
    await pageDoctor.screenshot({ path: path.join(ARTIFACT_DIR, 'doctor_05_logged_out_login.png') });

    await pageDoctor.close();

    // ========================================================
    // FINAL SUMMARY
    // ========================================================
    console.log('\n==================================================');
    console.log('🏁 FINAL SUMMARY OF SPLASH-FIRST VALIDATION');
    console.log('==================================================');
    let allPassed = true;
    for (const [key, passed] of Object.entries(results)) {
      console.log(`  ${key}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      if (!passed) allPassed = false;
    }
    console.log('==================================================');
    console.log(allPassed ? '🎉 ALL CHECKS PASSED PERFECTLY!' : '⚠️ SOME CHECKS FAILED');
    console.log('==================================================\n');
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
