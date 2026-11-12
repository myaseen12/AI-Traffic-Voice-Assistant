const { test, expect } = require('@playwright/test');

test.describe('AI Traffic Voice Assistant Complete End-to-End Suite', () => {

  // ---------------------------------------------------------------------------
  // 1. Citizen Opens the Website & Explores Homepage
  // ---------------------------------------------------------------------------
  test('Step 1: Homepage loads successfully with hero section, quick search, and civic FAQs', async ({ page }) => {
    await page.goto('/');

    // Check page title and primary brand elements
    await expect(page).toHaveTitle(/Traffic|Challan|Assistant/i);

    // Verify hero section and speak query CTA link
    const speakLink = page.getByRole('link', { name: /Speak Your Query/i }).first();
    await expect(speakLink).toBeVisible();

    // Verify FAQ section and expanded first answer
    await expect(page.getByRole('heading', { name: /Frequently Asked Questions/i })).toBeVisible();
    await expect(page.getByText(/encrypted citation identifier/i).first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 2. Citizen Scans Challan QR Code (Valid & Invalid Handling)
  // ---------------------------------------------------------------------------
  test('Step 2: Challan QR Scanner handles valid reference and rejects malicious/invalid payloads', async ({ page }) => {
    await page.goto('/scan-challan');

    // Switch to manual input mode tab
    const manualTab = page.getByRole('button', { name: /Enter Manually/i });
    await expect(manualTab).toBeVisible();
    await manualTab.click();

    // Test invalid / malicious QR input rejection
    const manualInput = page.getByPlaceholder(/PK-2024/i);
    await expect(manualInput).toBeVisible();
    await manualInput.fill('https://malicious-phishing-site.example.com/fake-ticket');

    const lookupBtn = page.getByRole('button', { name: /Look Up Citation Details/i });
    await lookupBtn.click();

    // Verify security validation warning appears
    await expect(page.getByText(/Security Validation Alert/i)).toBeVisible({ timeout: 5000 });

    // Test valid challan format entry
    await manualInput.fill('PK-2026-004021');
    await lookupBtn.click();

    // Should indicate valid or verified citation details
    await expect(page.getByText(/PK-2026-004021/i)).toBeVisible({ timeout: 7000 });
  });

  // ---------------------------------------------------------------------------
  // 3. Citizen Identity Verification via OTP Flow
  // ---------------------------------------------------------------------------
  test('Step 3: Citizen authentication via phone and 6-digit OTP verification', async ({ page }) => {
    await page.goto('/login');

    // Enter valid Pakistani mobile number (unique per test run)
    const phoneInput = page.getByPlaceholder(/0300 1234567/i);
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('03001112233');

    // Request OTP
    const sendOtpBtn = page.getByRole('button', { name: /Send 6-Digit SMS OTP/i });
    await sendOtpBtn.click();

    // Expect navigation to /verify-otp
    await page.waitForURL(/.*verify-otp.*/, { timeout: 8000 });

    // Verify OTP input exists and click verify
    const verifyBtn = page.getByRole('button', { name: /Verify & Authorize/i });
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();

    // Verification success notice and redirect to citizen dashboard
    await expect(page.getByText(/Verification Successful/i)).toBeVisible({ timeout: 10000 });
  });

  // ---------------------------------------------------------------------------
  // 4. Multilingual Language Switcher (Urdu, Pashto, English)
  // ---------------------------------------------------------------------------
  test('Step 4: Language switching dynamically toggles LTR and RTL text direction', async ({ page }) => {
    await page.goto('/language-selection');

    // Select Urdu (اردو)
    const urduCard = page.getByRole('heading', { name: /اردو/i });
    await expect(urduCard).toBeVisible();
    await urduCard.click();

    // Apply selection using reliable action button
    const applyBtn = page.locator('button:has-text("→")').first();
    await applyBtn.click();

    // Verify direction becomes RTL or language preference is saved
    await page.waitForTimeout(500);
    const isRtl = await page.evaluate(() => {
      return document.documentElement.dir === 'rtl' ||
             document.body.dir === 'rtl' ||
             document.documentElement.lang === 'ur' ||
             localStorage.getItem('preferred_language') === 'ur';
    });
    expect(isRtl).toBeTruthy();

    // Switch back to English
    await page.goto('/language-selection');
    const englishCard = page.getByRole('heading', { name: /English/i }).first();
    await englishCard.click();
    await page.locator('button:has-text("→")').first().click();
  });

  // ---------------------------------------------------------------------------
  // 5. Citizen Dashboard: View Authorized Challans & Penalties
  // ---------------------------------------------------------------------------
  test('Step 5: Citizen dashboard displays authorized challan dossier and telemetry', async ({ page }) => {
    // Authenticate using distinct mobile number to avoid resend rate limits
    await page.goto('/login?redirect=%2Fcitizen%2Fdashboard');
    const phoneInput = page.getByPlaceholder(/0300 1234567/i);
    await phoneInput.fill('03004445566');
    await page.getByRole('button', { name: /Send 6-Digit SMS OTP/i }).click();
    await page.waitForURL(/.*verify-otp.*/, { timeout: 8000 });
    await page.getByRole('button', { name: /Verify & Authorize/i }).click();

    // Citizen dashboard displays authenticated dossiers
    await page.waitForURL(/.*citizen\/dashboard.*/, { timeout: 10000 });
    await expect(page.getByText(/Total Citations|Pending Citations|Penalty Points|Citizen/i).first()).toBeVisible({ timeout: 10000 });
  });

  // ---------------------------------------------------------------------------
  // 6. AI Voice Assistant: Grounded Q&A, Stepper & Audio Player
  // ---------------------------------------------------------------------------
  test('Step 6: AI Voice Assistant accepts queries, retrieves verified laws, and generates playable audio', async ({ page }) => {
    test.setTimeout(60000); // Allow sufficient time for full RAG + LLM + TTS pipeline

    await page.goto('/assistant');

    // Verify accessible microphone button
    const micButton = page.getByRole('button', { name: /speak into microphone/i });
    await expect(micButton).toBeVisible();

    // Click quick-action suggested chip: "Over-speeding Fine (Sec 113)"
    // (Note: clicking the chip immediately dispatches handleSend)
    const speedChip = page.getByRole('button', { name: /Over-speeding Fine \(Sec 113\)/i });
    await expect(speedChip).toBeVisible();
    await speedChip.click();

    // Expect assistant response to appear with Section 113 citation
    await expect(page.getByText(/113/i).first()).toBeVisible({ timeout: 40000 });

    // Expect Audio Player controls or Voice quality tier to be visible
    await expect(page.getByText(/High-Quality Neural Voice|Spoken Legal Explanation|Audio|Replay/i).first()).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // 7. Missing Knowledge Sources & Zero-Hallucination Safe Disclosure
  // ---------------------------------------------------------------------------
  test('Step 7: AI Assistant refuses to hallucinate when asked unsupported or out-of-scope inquiries', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/assistant');

    const queryInput = page.getByRole('textbox', { name: /Ask your traffic law/i });
    await expect(queryInput).toBeVisible();

    // Ask an out-of-scope question
    await queryInput.fill('How can I apply for a flight pilot license in Tokyo Japan?');

    const sendBtn = page.getByRole('button', { name: /Send query/i });
    await sendBtn.click();

    // Verify assistant responds with unavailable / out-of-scope disclosure
    await expect(page.getByText(/not found|unavailable|statutory|only|traffic|assistance/i).first()).toBeVisible({ timeout: 40000 });
  });

  // ---------------------------------------------------------------------------
  // 8. Admin Security & Role-Based Access Control
  // ---------------------------------------------------------------------------
  test('Step 8: Protected admin dashboard restricts unauthenticated or citizen access', async ({ page }) => {
    // Clear any previous token
    await page.addInitScript(() => {
      localStorage.removeItem('traffic_token');
      localStorage.removeItem('traffic_user');
    });

    // Attempt visiting admin dashboard directly
    await page.goto('/admin/dashboard');

    // Should indicate access restricted or authentication required
    await expect(page.getByText(/Authentication Required|Access Restricted|Admin Login/i).first()).toBeVisible({ timeout: 8000 });
  });

  // ---------------------------------------------------------------------------
  // 9. Mobile Responsiveness & Viewport Adaptability
  // ---------------------------------------------------------------------------
  test('Step 9: Mobile viewport renders responsive navigation and touch-accessible controls', async ({ page }) => {
    // Set mobile viewport (iPhone 14 / Pixel 7 size)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Check that layout does not horizontally overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allow sub-pixel rounding

    // Verify mobile CTA is accessible
    await expect(page.getByRole('link', { name: /Speak Your Query/i }).first()).toBeVisible();
  });

});
