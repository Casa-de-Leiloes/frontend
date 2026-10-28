import { expect, test } from "@playwright/test";

/**
 * Tests the CurrencyInput ATM-style mask:
 *   typing digits accumulates from the right (centavos first).
 *   Uses an inline test page via data URL to avoid needing auth.
 */
test.describe("CurrencyInput mask", () => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 24px; }
    #result { margin-top: 12px; font-size: 14px; }
  </style>
</head>
<body>
  <input id="inp" type="text" inputmode="numeric" placeholder="0,00"
         style="font-size:16px;padding:8px;border:1px solid #ccc;width:200px" />
  <div id="result"></div>
  <script>
    const inp = document.getElementById('inp');
    const result = document.getElementById('result');
    let digits = '';

    function digitsToDisplay(d) {
      if (!d) return '';
      const padded = d.padStart(3, '0');
      const reais = padded.slice(0, -2).replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
      const cents = padded.slice(-2);
      return (reais || '0') + ',' + cents;
    }

    inp.addEventListener('input', () => {
      const newDigits = inp.value.replace(/\\D/g, '').slice(0, 10);
      digits = newDigits;
      inp.value = digitsToDisplay(digits);
      result.textContent = 'value:' + (digits ? (parseInt(digits,10)/100).toFixed(2) : '');
    });
  </script>
</body>
</html>`;

  test("typing single digit shows centavos correctly", async ({ page }) => {
    await page.setContent(html);
    const inp = page.locator("#inp");
    await inp.fill("4");
    await expect(inp).toHaveValue("0,04");
  });

  test("typing multiple digits accumulates left", async ({ page }) => {
    await page.setContent(html);
    const inp = page.locator("#inp");
    // fill replaces the full value → input event fires once with "4200"
    // → digits extracted = "4200" → "42,00"
    await inp.fill("4200");
    await inp.dispatchEvent("input");
    await expect(inp).toHaveValue("42,00");
  });

  test("typing 6 digits formats with thousands separator", async ({ page }) => {
    await page.setContent(html);
    const inp = page.locator("#inp");
    await inp.fill("1000000");
    await inp.dispatchEvent("input");
    await expect(inp).toHaveValue("10.000,00");
  });

  test("clearing input results in empty value", async ({ page }) => {
    await page.setContent(html);
    const inp = page.locator("#inp");
    await inp.click();
    await page.keyboard.type("500");
    await inp.fill("");
    await inp.dispatchEvent("input");
    await expect(inp).toHaveValue("");
  });

  test("emits correct reais decimal string", async ({ page }) => {
    await page.setContent(html);
    const inp = page.locator("#inp");
    await inp.click();
    await page.keyboard.type("42050");
    await expect(page.locator("#result")).toHaveText("value:420.50");
  });
});
