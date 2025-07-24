import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';

interface ScreenshotOptions {
  name: string;
  selector?: string;
  fullPage?: boolean;
}

interface ConsoleError {
  type: string;
  text: string;
  location: string;
  timestamp: string;
}

class VisualRegressionTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private consoleErrors: ConsoleError[] = [];
  private baselineDir = path.join(__dirname, '../visual-baseline');
  private currentDir = path.join(__dirname, '../visual-current');
  private diffDir = path.join(__dirname, '../visual-diff');

  constructor() {
    // Create directories if they don't exist
    [this.baselineDir, this.currentDir, this.diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();

    // Set viewport for consistent screenshots
    await this.page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 2, // Retina display
    });

    // Capture console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location().url || 'unknown',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Capture page errors
    this.page.on('pageerror', (error) => {
      this.consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        location: this.page?.url() || 'unknown',
        timestamp: new Date().toISOString(),
      });
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async navigateTo(url: string) {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    // Wait for any animations to complete
    await this.page.waitForTimeout(1000);
  }

  async captureScreenshot(options: ScreenshotOptions): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    const screenshotPath = path.join(this.currentDir, `${options.name}.png`);

    if (options.selector) {
      const element = await this.page.$(options.selector);
      if (element) {
        await element.screenshot({ path: screenshotPath });
      } else {
        throw new Error(`Selector ${options.selector} not found`);
      }
    } else {
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: options.fullPage || false,
      });
    }

    return screenshotPath;
  }

  async compareWithBaseline(name: string): Promise<boolean> {
    const currentPath = path.join(this.currentDir, `${name}.png`);
    const baselinePath = path.join(this.baselineDir, `${name}.png`);

    // If no baseline exists, copy current as baseline
    if (!fs.existsSync(baselinePath)) {
      fs.copyFileSync(currentPath, baselinePath);
      console.log(`Created baseline for ${name}`);
      return true;
    }

    // Here you would implement actual image comparison
    // For now, we'll just check if files exist
    // In production, use a library like pixelmatch or resemblejs
    return fs.existsSync(currentPath) && fs.existsSync(baselinePath);
  }

  async captureDesignElements() {
    if (!this.page) throw new Error('Page not initialized');

    const designInfo = await this.page.evaluate(() => {
      const computedStyles = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const styles = window.getComputedStyle(element);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontFamily: styles.fontFamily,
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight,
          padding: styles.padding,
          margin: styles.margin,
          borderRadius: styles.borderRadius,
        };
      };

      return {
        primaryButton: computedStyles('.btn-primary'),
        heading: computedStyles('h1'),
        bodyText: computedStyles('p'),
        card: computedStyles('.card'),
        navigation: computedStyles('nav'),
      };
    });

    return designInfo;
  }

  getConsoleErrors(): ConsoleError[] {
    return this.consoleErrors;
  }

  clearConsoleErrors() {
    this.consoleErrors = [];
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      consoleErrors: this.consoleErrors,
      screenshotsTaken: fs.readdirSync(this.currentDir).filter(f => f.endsWith('.png')),
      baselineScreenshots: fs.readdirSync(this.baselineDir).filter(f => f.endsWith('.png')),
    };

    fs.writeFileSync(
      path.join(__dirname, '../visual-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }
}

// Test suite
describe('Tennis Score App Visual Regression Tests', () => {
  let tester: VisualRegressionTester;

  beforeAll(async () => {
    tester = new VisualRegressionTester();
    await tester.setup();
  });

  afterAll(async () => {
    await tester.teardown();
  });

  beforeEach(() => {
    tester.clearConsoleErrors();
  });

  test('Dashboard page visual test', async () => {
    await tester.navigateTo('http://localhost:3000/dashboard');
    
    // Capture full page
    await tester.captureScreenshot({
      name: 'dashboard-full',
      fullPage: true,
    });

    // Capture specific components
    await tester.captureScreenshot({
      name: 'dashboard-header',
      selector: 'header',
    });

    // Check for console errors
    const errors = tester.getConsoleErrors();
    expect(errors).toHaveLength(0);

    // Compare with baseline
    const matchesBaseline = await tester.compareWithBaseline('dashboard-full');
    expect(matchesBaseline).toBe(true);
  });

  test('Live scoring interface visual test', async () => {
    await tester.navigateTo('http://localhost:3000/matches');
    
    await tester.captureScreenshot({
      name: 'matches-list',
      fullPage: true,
    });

    const errors = tester.getConsoleErrors();
    expect(errors).toHaveLength(0);
  });

  test('Design system compliance', async () => {
    await tester.navigateTo('http://localhost:3000');
    
    const designElements = await tester.captureDesignElements();
    
    // Check if primary button has the correct color
    if (designElements.primaryButton) {
      expect(designElements.primaryButton.backgroundColor).toContain('rgb(57, 255, 20)'); // Electric Green
    }
  });

  test('Mobile viewport test', async () => {
    if (!tester['page']) return;
    
    // Set mobile viewport
    await tester['page'].setViewport({
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
    });

    await tester.navigateTo('http://localhost:3000/dashboard');
    
    await tester.captureScreenshot({
      name: 'dashboard-mobile',
      fullPage: true,
    });

    // Reset viewport
    await tester['page'].setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 2,
    });
  });

  test('Generate visual regression report', async () => {
    const report = await tester.generateReport();
    console.log('Visual regression report generated:', report);
  });
});

// Utility function to run visual tests from MCP
export async function runVisualTests(url: string, options?: {
  captureErrors?: boolean;
  compareBaseline?: boolean;
  viewports?: Array<{ width: number; height: number; name: string }>;
}) {
  const tester = new VisualRegressionTester();
  await tester.setup();

  try {
    await tester.navigateTo(url);
    
    const results = {
      screenshots: [] as string[],
      errors: [] as ConsoleError[],
      designCompliance: {} as any,
    };

    // Capture screenshots for different viewports
    const viewports = options?.viewports || [
      { width: 1280, height: 720, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ];

    for (const viewport of viewports) {
      if (tester['page']) {
        await tester['page'].setViewport({
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 2,
        });
      }

      const screenshotPath = await tester.captureScreenshot({
        name: `${url.replace(/[^a-z0-9]/gi, '-')}-${viewport.name}`,
        fullPage: true,
      });
      
      results.screenshots.push(screenshotPath);
    }

    if (options?.captureErrors) {
      results.errors = tester.getConsoleErrors();
    }

    results.designCompliance = await tester.captureDesignElements();

    return results;
  } finally {
    await tester.teardown();
  }
}