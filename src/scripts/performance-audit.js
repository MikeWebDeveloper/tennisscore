/**
 * Comprehensive Performance Audit Script
 * Validates all performance optimizations and measures real improvements
 */

const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs').promises
const path = require('path')

// Performance audit configuration
const AUDIT_CONFIG = {
  port: 3000,
  chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  preset: 'desktop',
  throttling: {
    rttMs: 40,
    throughputKbps: 10 * 1024,
    cpuSlowdownMultiplier: 1,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0,
  },
  settings: {
    maxWaitForFcp: 15 * 1000,
    maxWaitForLoad: 35 * 1000,
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
}

// Performance budget thresholds
const PERFORMANCE_BUDGET = {
  'first-contentful-paint': 1500,
  'largest-contentful-paint': 2500,
  'first-meaningful-paint': 1600,
  'speed-index': 2000,
  'interactive': 3000,
  'total-blocking-time': 300,
  'cumulative-layout-shift': 0.1,
  'max-potential-fid': 130,
}

// Bundle size budget (in KB)
const BUNDLE_BUDGET = {
  'first-load-js': 150,
  'total-css': 30,
  'total-images': 200,
  'total-fonts': 80,
}

class PerformanceAuditor {
  constructor() {
    this.results = []
    this.chrome = null
  }

  async runAudit() {
    console.log('🚀 Starting comprehensive performance audit...')
    
    try {
      // Launch Chrome
      this.chrome = await chromeLauncher.launch({
        chromeFlags: AUDIT_CONFIG.chromeFlags
      })

      // Define pages to audit
      const pages = [
        { name: 'Landing Page', url: `http://localhost:${AUDIT_CONFIG.port}` },
        { name: 'Dashboard', url: `http://localhost:${AUDIT_CONFIG.port}/en/dashboard` },
        { name: 'Live Match', url: `http://localhost:${AUDIT_CONFIG.port}/en/matches/live/test` },
        { name: 'Match List', url: `http://localhost:${AUDIT_CONFIG.port}/en/matches` },
        { name: 'Player List', url: `http://localhost:${AUDIT_CONFIG.port}/en/players` },
      ]

      // Run audits for each page
      for (const page of pages) {
        console.log(`\n📊 Auditing: ${page.name}`)
        const result = await this.auditPage(page)
        this.results.push(result)
      }

      // Generate comprehensive report
      await this.generateReport()
      
      // Check if performance budget is met
      const budgetResults = this.checkPerformanceBudget()
      
      console.log('\n✅ Performance audit complete!')
      
      return {
        results: this.results,
        budgetResults,
        overallScore: this.calculateOverallScore(),
        recommendations: this.generateRecommendations(),
      }

    } catch (error) {
      console.error('❌ Performance audit failed:', error)
      throw error
    } finally {
      if (this.chrome) {
        await this.chrome.kill()
      }
    }
  }

  async auditPage(page) {
    const config = {
      extends: 'lighthouse:default',
      settings: {
        ...AUDIT_CONFIG.settings,
        port: this.chrome.port,
      },
    }

    try {
      const runnerResult = await lighthouse(page.url, null, config)
      
      const metrics = this.extractMetrics(runnerResult.lhr)
      const opportunities = this.extractOpportunities(runnerResult.lhr)
      const diagnostics = this.extractDiagnostics(runnerResult.lhr)

      console.log(`  Performance Score: ${metrics.performanceScore}/100`)
      console.log(`  LCP: ${metrics.largestContentfulPaint}ms`)
      console.log(`  FID: ${metrics.maxPotentialFid}ms`)
      console.log(`  CLS: ${metrics.cumulativeLayoutShift}`)

      return {
        page: page.name,
        url: page.url,
        timestamp: new Date().toISOString(),
        metrics,
        opportunities,
        diagnostics,
        rawReport: runnerResult.lhr,
      }
    } catch (error) {
      console.error(`  ❌ Failed to audit ${page.name}:`, error.message)
      return {
        page: page.name,
        url: page.url,
        error: error.message,
      }
    }
  }

  extractMetrics(lhr) {
    const audits = lhr.audits
    
    return {
      performanceScore: Math.round(lhr.categories.performance.score * 100),
      firstContentfulPaint: Math.round(audits['first-contentful-paint'].numericValue),
      largestContentfulPaint: Math.round(audits['largest-contentful-paint'].numericValue),
      firstMeaningfulPaint: Math.round(audits['first-meaningful-paint'].numericValue),
      speedIndex: Math.round(audits['speed-index'].numericValue),
      interactive: Math.round(audits['interactive'].numericValue),
      totalBlockingTime: Math.round(audits['total-blocking-time'].numericValue),
      cumulativeLayoutShift: Number(audits['cumulative-layout-shift'].numericValue.toFixed(3)),
      maxPotentialFid: Math.round(audits['max-potential-fid'].numericValue),
    }
  }

  extractOpportunities(lhr) {
    return lhr.audits['opportunities'] || Object.keys(lhr.audits)
      .filter(key => lhr.audits[key].details && lhr.audits[key].details.type === 'opportunity')
      .map(key => ({
        id: key,
        title: lhr.audits[key].title,
        description: lhr.audits[key].description,
        savings: lhr.audits[key].details.overallSavingsMs || 0,
      }))
      .filter(opp => opp.savings > 100) // Show only significant opportunities
      .sort((a, b) => b.savings - a.savings)
  }

  extractDiagnostics(lhr) {
    const diagnostics = []
    
    // Extract key diagnostics
    const keyDiagnostics = [
      'render-blocking-resources',
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'uses-optimized-images',
      'uses-text-compression',
      'uses-responsive-images',
      'efficient-animated-content',
      'unminified-css',
      'unminified-javascript',
    ]

    keyDiagnostics.forEach(id => {
      const audit = lhr.audits[id]
      if (audit && audit.score !== null && audit.score < 1) {
        diagnostics.push({
          id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue,
        })
      }
    })

    return diagnostics
  }

  checkPerformanceBudget() {
    const budgetResults = {
      passed: true,
      violations: [],
      summary: {},
    }

    this.results.forEach(result => {
      if (result.error) return

      const { metrics } = result
      
      // Check performance budget
      Object.entries(PERFORMANCE_BUDGET).forEach(([metric, threshold]) => {
        const value = metrics[this.mapMetricName(metric)]
        
        if (value > threshold) {
          budgetResults.passed = false
          budgetResults.violations.push({
            page: result.page,
            metric,
            value,
            threshold,
            exceeded: value - threshold,
          })
        }
      })
    })

    // Calculate summary statistics
    budgetResults.summary = this.calculateBudgetSummary()

    return budgetResults
  }

  mapMetricName(budgetMetric) {
    const mapping = {
      'first-contentful-paint': 'firstContentfulPaint',
      'largest-contentful-paint': 'largestContentfulPaint',
      'first-meaningful-paint': 'firstMeaningfulPaint',
      'speed-index': 'speedIndex',
      'interactive': 'interactive',
      'total-blocking-time': 'totalBlockingTime',
      'cumulative-layout-shift': 'cumulativeLayoutShift',
      'max-potential-fid': 'maxPotentialFid',
    }
    return mapping[budgetMetric] || budgetMetric
  }

  calculateBudgetSummary() {
    const summary = {}
    
    this.results.forEach(result => {
      if (result.error) return
      
      Object.entries(result.metrics).forEach(([metric, value]) => {
        if (!summary[metric]) {
          summary[metric] = { values: [], avg: 0, min: Infinity, max: -Infinity }
        }
        
        summary[metric].values.push(value)
        summary[metric].min = Math.min(summary[metric].min, value)
        summary[metric].max = Math.max(summary[metric].max, value)
      })
    })

    // Calculate averages
    Object.keys(summary).forEach(metric => {
      const values = summary[metric].values
      summary[metric].avg = values.reduce((sum, val) => sum + val, 0) / values.length
    })

    return summary
  }

  calculateOverallScore() {
    const validResults = this.results.filter(r => !r.error)
    if (validResults.length === 0) return 0

    const totalScore = validResults.reduce((sum, result) => sum + result.metrics.performanceScore, 0)
    return Math.round(totalScore / validResults.length)
  }

  generateRecommendations() {
    const recommendations = []
    const allOpportunities = this.results
      .filter(r => !r.error)
      .flatMap(r => r.opportunities)

    // Group opportunities by type
    const opportunityGroups = {}
    allOpportunities.forEach(opp => {
      if (!opportunityGroups[opp.id]) {
        opportunityGroups[opp.id] = {
          title: opp.title,
          description: opp.description,
          totalSavings: 0,
          occurrences: 0,
        }
      }
      opportunityGroups[opp.id].totalSavings += opp.savings
      opportunityGroups[opp.id].occurrences++
    })

    // Sort by total savings
    const sortedOpportunities = Object.entries(opportunityGroups)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalSavings - a.totalSavings)
      .slice(0, 10) // Top 10 recommendations

    sortedOpportunities.forEach(opp => {
      recommendations.push({
        type: 'opportunity',
        title: opp.title,
        description: opp.description,
        impact: 'high',
        savings: `${Math.round(opp.totalSavings)}ms`,
        occurrences: opp.occurrences,
      })
    })

    return recommendations
  }

  async generateReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        overallScore: this.calculateOverallScore(),
        totalPages: this.results.length,
        successfulAudits: this.results.filter(r => !r.error).length,
        failedAudits: this.results.filter(r => r.error).length,
      },
      budgetAnalysis: this.checkPerformanceBudget(),
      recommendations: this.generateRecommendations(),
      results: this.results,
    }

    // Write detailed JSON report
    const reportsDir = path.join(process.cwd(), 'reports')
    await fs.mkdir(reportsDir, { recursive: true })
    
    const reportPath = path.join(reportsDir, `performance-audit-${Date.now()}.json`)
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2))

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(reportData)
    const htmlPath = path.join(reportsDir, `performance-audit-${Date.now()}.html`)
    await fs.writeFile(htmlPath, htmlReport)

    console.log(`\n📄 Reports generated:`)
    console.log(`  JSON: ${reportPath}`)
    console.log(`  HTML: ${htmlPath}`)
  }

  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tennis App Performance Audit</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #39ff14; padding-bottom: 10px; }
        .score { font-size: 3em; font-weight: bold; text-align: center; margin: 20px 0; }
        .score.excellent { color: #39ff14; }
        .score.good { color: #22c55e; }
        .score.needs-improvement { color: #f59e0b; }
        .score.poor { color: #ef4444; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #666; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #333; }
        .results { margin: 30px 0; }
        .result-card { background: #f8f9fa; margin: 15px 0; padding: 20px; border-radius: 8px; }
        .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .result-score { font-size: 1.5em; font-weight: bold; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .metric { text-align: center; }
        .metric-label { font-size: 0.9em; color: #666; margin-bottom: 5px; }
        .metric-value { font-size: 1.2em; font-weight: bold; }
        .recommendations { margin: 30px 0; }
        .recommendation { background: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; }
        .budget-violations { background: #f8d7da; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎾 Tennis App Performance Audit</h1>
        <p><strong>Generated:</strong> ${data.timestamp}</p>
        
        <div class="score ${this.getScoreClass(data.summary.overallScore)}">${data.summary.overallScore}/100</div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Pages</h3>
                <div class="value">${data.summary.totalPages}</div>
            </div>
            <div class="summary-card">
                <h3>Successful Audits</h3>
                <div class="value">${data.summary.successfulAudits}</div>
            </div>
            <div class="summary-card">
                <h3>Failed Audits</h3>
                <div class="value">${data.summary.failedAudits}</div>
            </div>
        </div>

        ${data.budgetAnalysis.violations.length > 0 ? `
        <div class="budget-violations">
            <h3>⚠️ Performance Budget Violations</h3>
            ${data.budgetAnalysis.violations.map(v => `
                <p><strong>${v.page}</strong>: ${v.metric} exceeded by ${v.exceeded}ms (${v.value}ms > ${v.threshold}ms)</p>
            `).join('')}
        </div>
        ` : '<div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;"><h3>✅ All Performance Budgets Met!</h3></div>'}

        <div class="results">
            <h2>Page Results</h2>
            ${data.results.filter(r => !r.error).map(result => `
                <div class="result-card">
                    <div class="result-header">
                        <h3>${result.page}</h3>
                        <div class="result-score ${this.getScoreClass(result.metrics.performanceScore)}">${result.metrics.performanceScore}/100</div>
                    </div>
                    <div class="metrics">
                        <div class="metric">
                            <div class="metric-label">LCP</div>
                            <div class="metric-value">${result.metrics.largestContentfulPaint}ms</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">FID</div>
                            <div class="metric-value">${result.metrics.maxPotentialFid}ms</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">CLS</div>
                            <div class="metric-value">${result.metrics.cumulativeLayoutShift}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">FCP</div>
                            <div class="metric-value">${result.metrics.firstContentfulPaint}ms</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">SI</div>
                            <div class="metric-value">${result.metrics.speedIndex}ms</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">TBT</div>
                            <div class="metric-value">${result.metrics.totalBlockingTime}ms</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="recommendations">
            <h2>Top Recommendations</h2>
            ${data.recommendations.map(rec => `
                <div class="recommendation">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    <p><strong>Potential Savings:</strong> ${rec.savings} across ${rec.occurrences} page(s)</p>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `
  }

  getScoreClass(score) {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 50) return 'needs-improvement'
    return 'poor'
  }
}

// CLI execution
async function main() {
  const auditor = new PerformanceAuditor()
  
  try {
    const results = await auditor.runAudit()
    
    console.log('\n📊 Audit Summary:')
    console.log(`Overall Score: ${results.overallScore}/100`)
    console.log(`Budget Violations: ${results.budgetResults.violations.length}`)
    console.log(`Top Recommendations: ${results.recommendations.length}`)
    
    // Exit with error code if performance is poor
    if (results.overallScore < 75 || results.budgetResults.violations.length > 0) {
      console.log('\n❌ Performance audit failed - improvements needed')
      process.exit(1)
    } else {
      console.log('\n✅ Performance audit passed!')
      process.exit(0)
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = PerformanceAuditor