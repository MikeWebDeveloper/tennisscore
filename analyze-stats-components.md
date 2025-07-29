# Statistics Components Translation Analysis

## Components to Check:
1. clutch-performance.tsx
2. head-to-head-analysis.tsx  
3. serve-return-analysis.tsx
4. virtual-matches-list.tsx

## Common Hardcoded Text Patterns to Look For:

### UI Labels and Titles
- Chart titles: "Clutch Performance", "Head to Head", "Serve Return Analysis"
- Section headers: "Performance Metrics", "Analysis", "Statistics"
- Button labels: "View More", "Export", "Share", "Filter"

### Data Labels
- Metric names: "Win Rate", "Points Won", "Break Points", "Aces"
- Time periods: "Last 7 days", "This month", "All time"
- Status indicators: "Loading", "No data", "Error"

### Tooltips and Help Text
- Explanatory text for metrics
- Instructions for using features
- Error messages

### Table Headers
- Column names like "Player", "Match", "Score", "Date"
- Sort indicators: "Sort by", "Ascending", "Descending"

### Chart Elements
- Axis labels: "Games", "Sets", "Points"
- Legend items
- Data point labels

### Empty States
- "No matches found"
- "Start playing to see statistics"
- "Select players to compare"

### Form Elements
- Placeholder text in inputs
- Validation messages
- Submit/Cancel buttons

## Translation Keys Needed:
All these should use the statistics namespace with appropriate keys like:
- t('statistics.clutchPerformance')
- t('statistics.headToHead')
- t('statistics.serveReturnAnalysis')
- t('statistics.noDataAvailable')
- t('common.loading')
- t('common.error')