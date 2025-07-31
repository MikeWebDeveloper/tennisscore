// Dynamic imports for jsPDF - loaded only when needed
let jsPDF: any = null
let autoTable: any = null

// Lazy loader for PDF libraries
async function loadPDFLibraries() {
  if (!jsPDF || !autoTable) {
    console.log('📦 Loading PDF libraries...')
    const start = performance.now()
    
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ])
    
    jsPDF = jsPDFModule.default
    autoTable = autoTableModule.default
    
    const duration = Math.round(performance.now() - start)
    console.log(`✅ PDF libraries loaded in ${duration}ms`)
  }
  
  return { jsPDF, autoTable }
}
import { Match, MatchFormat, PointDetail as StorePointDetail } from '@/stores/matchStore'
import { PointDetail } from '@/lib/types'
import { calculateMatchStats, EnhancedMatchStats, calculateDetailedMatchStats, DetailedMatchStats } from '@/lib/utils/match-stats'
import { format } from 'date-fns'

// Type definitions for export data structures
export interface MatchReportHeader {
  title: string
  matchDate: string
  duration: string
  venue?: string
  tournament?: string
  matchType: string
  format: string
  surface?: string
  exportType: 'live_set' | 'full_match'
  exportTimestamp: string
  generatedBy: string
}

export interface PlayerInfo {
  name: string
  id: string
  ranking?: string
  country?: string
  seed?: number
}

export interface MatchSummary {
  winner: PlayerInfo
  loser: PlayerInfo
  finalScore: string
  matchDuration: string
  totalPoints: number
  keyMoments: string[]
  retired?: boolean
  retirementReason?: string
}

export interface SetBreakdown {
  setNumber: number
  score: [number, number]
  duration: string
  gameBreakdown: GameResult[]
  tiebreakDetails?: TiebreakDetails
  keyStats: SetStats
}

export interface GameResult {
  gameNumber: number
  winner: 'p1' | 'p2'
  score: string
  isBreak: boolean
  duration?: string
}

export interface TiebreakDetails {
  finalScore: [number, number]
  pointByPoint: string[]
  duration: string
}

export interface SetStats {
  firstServePercentage: [number, number]
  aces: [number, number]
  doubleFaults: [number, number]
  winners: [number, number]
  unforcedErrors: [number, number]
  breakPoints: { faced: [number, number], converted: [number, number] }
}

export interface PointSummary {
  pointNumber: number
  gameScore: string
  server: string
  winner: string
  pointType: string
  isBreakPoint: boolean
  isSetPoint: boolean
  isMatchPoint: boolean
  description: string
  timestamp: string
}

export interface ExportOptions {
  includePointByPoint: boolean
  includeAdvancedStats: boolean
  includeCharts: boolean
  includeTrends: boolean
  template: 'professional' | 'basic' | 'detailed'
  exportType: 'live_set' | 'full_match'
  setNumber?: number // For live set exports
}

export interface MatchExportData {
  header: MatchReportHeader
  players: [PlayerInfo, PlayerInfo]
  summary: MatchSummary
  statistics: EnhancedMatchStats
  detailedStats?: DetailedMatchStats
  setBreakdowns: SetBreakdown[]
  pointByPoint?: PointSummary[]
  options: ExportOptions
}

// Main export function
export class MatchExporter {
  private doc: any
  private currentY: number = 20
  private pageWidth: number = 210 // A4 width in mm
  private pageHeight: number = 297 // A4 height in mm
  private margin: number = 20
  private contentWidth: number = 170 // pageWidth - 2 * margin
  private colors = {
    primary: [39, 174, 96] as [number, number, number],     // Green
    secondary: [52, 152, 219] as [number, number, number],   // Blue
    accent: [155, 89, 182] as [number, number, number],      // Purple
    dark: [44, 62, 80] as [number, number, number],          // Dark gray
    light: [236, 240, 241] as [number, number, number],      // Light gray
    text: [44, 62, 80] as [number, number, number],          // Dark text
    header: [26, 188, 156] as [number, number, number],      // Teal
    warning: [230, 126, 34] as [number, number, number],     // Orange
    success: [39, 174, 96] as [number, number, number],      // Green
    error: [231, 76, 60] as [number, number, number]         // Red
  }

  private jsPDFClass: any
  
  constructor(jsPDFInstance?: any) {
    this.jsPDFClass = jsPDFInstance
    // If jsPDF is provided, create document immediately
    if (jsPDFInstance) {
      this.doc = new jsPDFInstance('p', 'mm', 'a4')
      this.initializeDimensions()
    }
  }
  
  private initializeDimensions() {
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.contentWidth = this.pageWidth - (this.margin * 2)
  }

  async exportMatch(match: Match, playerNames: [string, string], options: ExportOptions): Promise<Blob> {
    // Ensure PDF libraries are loaded if not already initialized
    if (!this.doc && !this.jsPDFClass) {
      const { jsPDF, autoTable: loadedAutoTable } = await loadPDFLibraries()
      this.jsPDFClass = jsPDF
      this.doc = new jsPDF('p', 'mm', 'a4')
      this.initializeDimensions()
      // autoTable is already set globally by loadPDFLibraries
    }
    
    const exportData = this.prepareExportData(match, playerNames, options)
    
    // Generate PDF based on template
    switch (options.template) {
      case 'professional':
        this.generateProfessionalReport(exportData)
        break
      case 'detailed':
        this.generateDetailedReport(exportData)
        break
      case 'basic':
      default:
        this.generateBasicReport(exportData)
        break
    }

    return this.doc.output('blob')
  }

  private prepareExportData(match: Match, playerNames: [string, string], options: ExportOptions): MatchExportData {
    // Convert store PointDetail to lib types PointDetail format
    const pointLog: PointDetail[] = (match.pointLog || []).map((point: StorePointDetail): PointDetail => ({
      id: point.id,
      timestamp: point.timestamp,
      pointNumber: point.pointNumber,
      setNumber: point.setNumber,
      gameNumber: point.gameNumber,
      gameScore: point.gameScore,
      winner: point.winner,
      server: point.server,
      serveType: 'first' as const, // Default values for missing fields
      serveOutcome: 'winner' as const,
      rallyLength: 1,
      pointOutcome: 'winner' as const,
      lastShotType: point.lastShotType === 'other' ? 'forehand' : point.lastShotType,
      lastShotPlayer: point.lastShotPlayer,
      isBreakPoint: point.isBreakPoint,
      isSetPoint: point.isSetPoint,
      isMatchPoint: point.isMatchPoint,
      isGameWinning: point.isGameWinning,
      isSetWinning: point.isSetWinning,
      isMatchWinning: point.isMatchWinning,
      notes: point.notes
    }))
    
    const statistics = calculateMatchStats(pointLog)
    const detailedStats = calculateDetailedMatchStats(pointLog)
    
    // Prepare header
    const header: MatchReportHeader = {
      title: options.exportType === 'live_set' ? `Set ${options.setNumber} Report` : 'Match Report',
      matchDate: format(new Date(match.matchDate), 'MMMM d, yyyy'),
      duration: this.calculateMatchDuration(match),
      matchType: 'Singles', // Assuming singles for now
      format: this.getMatchFormatString(match.matchFormat),
      exportType: options.exportType,
      exportTimestamp: format(new Date(), 'MMMM d, yyyy - h:mm a'),
      generatedBy: 'TennisScore App'
    }

    // Prepare players
    const players: [PlayerInfo, PlayerInfo] = [
      { name: playerNames[0], id: match.playerOneId },
      { name: playerNames[1], id: match.playerTwoId }
    ]

    // Prepare summary
    const summary: MatchSummary = {
      winner: match.winnerId === match.playerOneId ? players[0] : players[1],
      loser: match.winnerId === match.playerOneId ? players[1] : players[0],
      finalScore: this.formatFinalScore(match),
      matchDuration: this.calculateMatchDuration(match),
      totalPoints: pointLog.length,
      keyMoments: this.extractKeyMoments(pointLog),
      retired: !!match.retirementReason,
      retirementReason: match.retirementReason
    }

    // Prepare set breakdowns
    const setBreakdowns = this.prepareSetBreakdowns(match, pointLog, options)

    // Prepare point-by-point if requested
    const pointByPoint = options.includePointByPoint ? this.preparePointByPoint(pointLog, players) : undefined

    return {
      header,
      players,
      summary,
      statistics,
      detailedStats,
      setBreakdowns,
      pointByPoint,
      options
    }
  }

  private generateProfessionalReport(data: MatchExportData): void {
    this.addModernHeader(data.header, data.players, data.summary)
    this.addMatchOverview(data.summary)
    this.addCoreStatistics(data.statistics, data.players)
    
    if (data.detailedStats?.hasDetailedData && data.options.includeAdvancedStats) {
      this.addAdvancedStatistics(data.detailedStats, data.players)
    }
    
    this.addSetAnalysis(data.setBreakdowns)
    
    if (data.pointByPoint && data.options.includePointByPoint) {
      this.addPointByPointAnalysis(data.pointByPoint)
    }
    
    this.addFooter()
  }

  private generateDetailedReport(data: MatchExportData): void {
    this.addModernHeader(data.header, data.players, data.summary)
    this.addMatchOverview(data.summary)
    this.addCoreStatistics(data.statistics, data.players)
    
    if (data.detailedStats?.hasDetailedData) {
      this.addAdvancedStatistics(data.detailedStats, data.players)
      this.addTacticalAnalysis(data.detailedStats, data.players)
      this.addPressurePointAnalysis(data.detailedStats)
    }
    
    this.addSetAnalysis(data.setBreakdowns)
    
    if (data.pointByPoint && data.options.includePointByPoint) {
      this.addPointByPointAnalysis(data.pointByPoint)
    }
    
    this.addFooter()
  }

  private generateBasicReport(data: MatchExportData): void {
    this.addModernHeader(data.header, data.players, data.summary)
    this.addMatchOverview(data.summary)
    
    // Simplified core statistics for basic template
    this.addSectionHeader('MATCH STATISTICS')
    const basicData = [
      ['Statistic', data.players[0].name, data.players[1].name],
      ['Total Points Won', data.statistics.totalPointsWonByPlayer[0].toString(), data.statistics.totalPointsWonByPlayer[1].toString()],
      ['Service Win %', `${data.statistics.servicePointsWonPercentageByPlayer[0]}%`, `${data.statistics.servicePointsWonPercentageByPlayer[1]}%`],
      ['Return Win %', `${data.statistics.receivingPointsWonPercentageByPlayer[0]}%`, `${data.statistics.receivingPointsWonPercentageByPlayer[1]}%`],
      ['Break Points', `${data.statistics.breakPointsByPlayer.converted[0]}/${data.statistics.breakPointsByPlayer.faced[0]}`, `${data.statistics.breakPointsByPlayer.converted[1]}/${data.statistics.breakPointsByPlayer.faced[1]}`],
      ['Aces', data.statistics.acesByPlayer[0].toString(), data.statistics.acesByPlayer[1].toString()],
      ['Winners', data.statistics.winnersByPlayer[0].toString(), data.statistics.winnersByPlayer[1].toString()],
      ['Unforced Errors', data.statistics.unforcedErrorsByPlayer[0].toString(), data.statistics.unforcedErrorsByPlayer[1].toString()]
    ]
    
    this.addStyledTable(basicData, this.colors.primary)
    
    this.addSetAnalysis(data.setBreakdowns)
    this.addFooter()
  }

  private addModernHeader(header: MatchReportHeader, players: [PlayerInfo, PlayerInfo], summary: MatchSummary): void {
    // Header background
    this.doc.setFillColor(...this.colors.header)
    this.doc.rect(0, 0, this.pageWidth, 45, 'F')

    // Title
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(28)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('TENNIS MATCH REPORT', this.pageWidth / 2, 20, { align: 'center' })
    
    // Match date and format
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`${header.matchDate} • ${header.format}`, this.pageWidth / 2, 32, { align: 'center' })
    
    if (header.tournament) {
      this.doc.text(header.tournament, this.pageWidth / 2, 40, { align: 'center' })
    }

    this.currentY = 55

    // Player vs Player section
    this.doc.setTextColor(...this.colors.text)
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    const vsText = `${players[0].name} vs ${players[1].name}`
    this.doc.text(vsText, this.pageWidth / 2, this.currentY, { align: 'center' })
    this.currentY += 15

    // Winner and score - prominent display
    if (summary.winner) {
      this.doc.setFillColor(...this.colors.success)
      this.doc.roundedRect(this.margin, this.currentY - 5, this.contentWidth, 25, 3, 3, 'F')
      
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(16)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(`Winner: ${summary.winner.name}`, this.pageWidth / 2, this.currentY + 8, { align: 'center' })
      
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`Final Score: ${summary.finalScore}`, this.pageWidth / 2, this.currentY + 18, { align: 'center' })
      
      this.currentY += 35
    }

    this.currentY += 10
  }

  private addMatchOverview(summary: MatchSummary): void {
    this.addSectionHeader('MATCH OVERVIEW')
    
    // Overview cards in a grid
    const cardWidth = (this.contentWidth - 10) / 3
    const cardHeight = 20
    const cardSpacing = 5
    
    // Duration card
    this.doc.setFillColor(...this.colors.light)
    this.doc.roundedRect(this.margin, this.currentY, cardWidth, cardHeight, 2, 2, 'F')
    this.doc.setTextColor(...this.colors.text)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('DURATION', this.margin + 2, this.currentY + 6)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(summary.matchDuration, this.margin + 2, this.currentY + 15)
    
    // Total points card
    this.doc.setFillColor(...this.colors.light)
    this.doc.roundedRect(this.margin + cardWidth + cardSpacing, this.currentY, cardWidth, cardHeight, 2, 2, 'F')
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('TOTAL POINTS', this.margin + cardWidth + cardSpacing + 2, this.currentY + 6)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(summary.totalPoints.toString(), this.margin + cardWidth + cardSpacing + 2, this.currentY + 15)
    
    // Sets played card
    this.doc.setFillColor(...this.colors.light)
    this.doc.roundedRect(this.margin + (cardWidth + cardSpacing) * 2, this.currentY, cardWidth, cardHeight, 2, 2, 'F')
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('SETS PLAYED', this.margin + (cardWidth + cardSpacing) * 2 + 2, this.currentY + 6)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    const setsPlayed = summary.finalScore.split(',').length
    this.doc.text(setsPlayed.toString(), this.margin + (cardWidth + cardSpacing) * 2 + 2, this.currentY + 15)
    
    this.currentY += cardHeight + 15

    // Key moments section
    if (summary.keyMoments.length > 0) {
      this.addSubsectionHeader('Key Moments')
      
      summary.keyMoments.slice(0, 8).forEach((moment, index) => {
        this.doc.setFillColor(...this.colors.light)
        this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 8, 1, 1, 'F')
        
        this.doc.setTextColor(...this.colors.text)
        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'normal')
        this.doc.text(`${index + 1}. ${moment}`, this.margin + 3, this.currentY + 5)
        this.currentY += 10
      })
      
      this.currentY += 5
    }

    this.currentY += 10
  }

  private addCoreStatistics(stats: EnhancedMatchStats, players: [PlayerInfo, PlayerInfo]): void {
    this.addSectionHeader('CORE STATISTICS')

    // Service Statistics
    this.addSubsectionHeader('Service Performance')
    const serviceData = [
      ['Metric', players[0].name, players[1].name],
      ['Service Points Won', `${stats.servicePointsWonByPlayer[0]}/${stats.servicePointsPlayedByPlayer[0]}`, `${stats.servicePointsWonByPlayer[1]}/${stats.servicePointsPlayedByPlayer[1]}`],
      ['Service Win %', `${stats.servicePointsWonPercentageByPlayer[0]}%`, `${stats.servicePointsWonPercentageByPlayer[1]}%`],
      ['First Serve %', `${stats.firstServePercentageByPlayer[0]}%`, `${stats.firstServePercentageByPlayer[1]}%`],
      ['First Serve Points Won', `${stats.firstServePointsWonByPlayer[0]}%`, `${stats.firstServePointsWonByPlayer[1]}%`],
      ['Aces', stats.acesByPlayer[0].toString(), stats.acesByPlayer[1].toString()],
      ['Double Faults', stats.doubleFaultsByPlayer[0].toString(), stats.doubleFaultsByPlayer[1].toString()]
    ]

    this.addStyledTable(serviceData, this.colors.secondary)

    // Return Statistics
    this.addSubsectionHeader('Return Performance')
    const returnData = [
      ['Metric', players[0].name, players[1].name],
      ['Return Points Won', `${stats.receivingPointsWonByPlayer[0]}/${stats.receivingPointsPlayedByPlayer[0]}`, `${stats.receivingPointsWonByPlayer[1]}/${stats.receivingPointsPlayedByPlayer[1]}`],
      ['Return Win %', `${stats.receivingPointsWonPercentageByPlayer[0]}%`, `${stats.receivingPointsWonPercentageByPlayer[1]}%`],
      ['Break Points Converted', `${stats.breakPointsByPlayer.converted[0]}/${stats.breakPointsByPlayer.faced[0]}`, `${stats.breakPointsByPlayer.converted[1]}/${stats.breakPointsByPlayer.faced[1]}`],
      ['Break Point %', `${stats.breakPointsByPlayer.conversionRate[0]}%`, `${stats.breakPointsByPlayer.conversionRate[1]}%`]
    ]

    this.addStyledTable(returnData, this.colors.accent)

    // Shot Statistics
    this.addSubsectionHeader('Shot Statistics')
    const shotData = [
      ['Metric', players[0].name, players[1].name],
      ['Total Points Won', stats.totalPointsWonByPlayer[0].toString(), stats.totalPointsWonByPlayer[1].toString()],
      ['Winners', stats.winnersByPlayer[0].toString(), stats.winnersByPlayer[1].toString()],
      ['Unforced Errors', stats.unforcedErrorsByPlayer[0].toString(), stats.unforcedErrorsByPlayer[1].toString()],
      ['Forced Errors', stats.forcedErrorsByPlayer[0].toString(), stats.forcedErrorsByPlayer[1].toString()],
      ['Winner/UE Ratio', `${(stats.winnersByPlayer[0] / Math.max(stats.unforcedErrorsByPlayer[0], 1)).toFixed(2)}`, `${(stats.winnersByPlayer[1] / Math.max(stats.unforcedErrorsByPlayer[1], 1)).toFixed(2)}`]
    ]

    this.addStyledTable(shotData, this.colors.success)
  }

  private addStyledTable(data: string[][], headerColor: [number, number, number]): void {
    // autoTable should already be loaded by exportMatch
    autoTable(this.doc, {
      head: [data[0]],
      body: data.slice(1),
      startY: this.currentY,
      styles: {
        fontSize: 9,
        cellPadding: 6,
        lineColor: [230, 230, 230],
        lineWidth: 0.5,
        textColor: this.colors.text
      },
      headStyles: {
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold', halign: 'left' },
        1: { cellWidth: 55, halign: 'center' },
        2: { cellWidth: 55, halign: 'center' }
      },
      margin: { left: this.margin, right: this.margin },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.5
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addAdvancedStatistics(stats: DetailedMatchStats, players: [PlayerInfo, PlayerInfo]): void {
    if (!stats.hasDetailedData) return

    this.addSectionHeader('ADVANCED STATISTICS')

    // Serve Direction Analysis
    if (stats.serveDirectionStats.playerOne.totalAttempts > 0 || stats.serveDirectionStats.playerTwo.totalAttempts > 0) {
      this.addSubsectionHeader('Serve Direction Analysis')

      const serveData = [
        ['Direction', `${players[0].name}`, `${players[1].name}`],
        ['Wide Serves', 
         `${stats.serveDirectionStats.playerOne.wide.attempts} (${stats.serveDirectionStats.playerOne.wide.attempts > 0 ? Math.round((stats.serveDirectionStats.playerOne.wide.successful / stats.serveDirectionStats.playerOne.wide.attempts) * 100) : 0}%)`,
         `${stats.serveDirectionStats.playerTwo.wide.attempts} (${stats.serveDirectionStats.playerTwo.wide.attempts > 0 ? Math.round((stats.serveDirectionStats.playerTwo.wide.successful / stats.serveDirectionStats.playerTwo.wide.attempts) * 100) : 0}%)`],
        ['Body Serves', 
         `${stats.serveDirectionStats.playerOne.body.attempts} (${stats.serveDirectionStats.playerOne.body.attempts > 0 ? Math.round((stats.serveDirectionStats.playerOne.body.successful / stats.serveDirectionStats.playerOne.body.attempts) * 100) : 0}%)`,
         `${stats.serveDirectionStats.playerTwo.body.attempts} (${stats.serveDirectionStats.playerTwo.body.attempts > 0 ? Math.round((stats.serveDirectionStats.playerTwo.body.successful / stats.serveDirectionStats.playerTwo.body.attempts) * 100) : 0}%)`],
        ['T Serves (Center)', 
         `${stats.serveDirectionStats.playerOne.t.attempts} (${stats.serveDirectionStats.playerOne.t.attempts > 0 ? Math.round((stats.serveDirectionStats.playerOne.t.successful / stats.serveDirectionStats.playerOne.t.attempts) * 100) : 0}%)`,
         `${stats.serveDirectionStats.playerTwo.t.attempts} (${stats.serveDirectionStats.playerTwo.t.attempts > 0 ? Math.round((stats.serveDirectionStats.playerTwo.t.successful / stats.serveDirectionStats.playerTwo.t.attempts) * 100) : 0}%)`],
        ['Preferred Direction', stats.serveDirectionStats.playerOne.bestDirection || 'N/A', stats.serveDirectionStats.playerTwo.bestDirection || 'N/A']
      ]

      this.addStyledTable(serveData, this.colors.warning)
    }
  }

  private addTacticalAnalysis(stats: DetailedMatchStats, players: [PlayerInfo, PlayerInfo]): void {
    this.addSubsectionHeader('Tactical Analysis')

    // Shot direction patterns
    if (stats.shotDirectionStats.playerOne.totalShots > 0 || stats.shotDirectionStats.playerTwo.totalShots > 0) {
      const shotData = [
        ['Shot Pattern', `${players[0].name}`, `${players[1].name}`],
        ['Long Shots', 
         `${stats.shotDirectionStats.playerOne.long.attempts} (W:${stats.shotDirectionStats.playerOne.long.winners}/E:${stats.shotDirectionStats.playerOne.long.errors})`,
         `${stats.shotDirectionStats.playerTwo.long.attempts} (W:${stats.shotDirectionStats.playerTwo.long.winners}/E:${stats.shotDirectionStats.playerTwo.long.errors})`],
        ['Wide Shots', 
         `${stats.shotDirectionStats.playerOne.wide.attempts} (W:${stats.shotDirectionStats.playerOne.wide.winners}/E:${stats.shotDirectionStats.playerOne.wide.errors})`,
         `${stats.shotDirectionStats.playerTwo.wide.attempts} (W:${stats.shotDirectionStats.playerTwo.wide.winners}/E:${stats.shotDirectionStats.playerTwo.wide.errors})`],
        ['Net Shots', 
         `${stats.shotDirectionStats.playerOne.net.attempts} (W:${stats.shotDirectionStats.playerOne.net.winners}/E:${stats.shotDirectionStats.playerOne.net.errors})`,
         `${stats.shotDirectionStats.playerTwo.net.attempts} (W:${stats.shotDirectionStats.playerTwo.net.winners}/E:${stats.shotDirectionStats.playerTwo.net.errors})`],
        ['Preferred Shot', stats.shotDirectionStats.playerOne.preferredDirection || 'N/A', stats.shotDirectionStats.playerTwo.preferredDirection || 'N/A']
      ]

      this.addStyledTable(shotData, this.colors.accent)
    }
  }

  private addPressurePointAnalysis(stats: DetailedMatchStats): void {
    const pressureStats = stats.contextualStats.pressurePointPerformance
    if (pressureStats.breakPoints.total > 0 || pressureStats.setPoints.total > 0) {
      this.addSubsectionHeader('Pressure Point Performance')

      const pressureData = [
        ['Critical Situation', 'Total Opportunities', 'Converted', 'Success Rate'],
        ['Break Point Opportunities', pressureStats.breakPoints.total.toString(), pressureStats.breakPoints.won.toString(), `${pressureStats.breakPoints.percentage}%`],
        ['Set Point Opportunities', pressureStats.setPoints.total.toString(), pressureStats.setPoints.won.toString(), `${pressureStats.setPoints.percentage}%`],
        ['Match Point Opportunities', pressureStats.matchPoints.total.toString(), pressureStats.matchPoints.won.toString(), `${pressureStats.matchPoints.percentage}%`]
      ]

      this.addStyledTable(pressureData, this.colors.error)
    }
  }


  private addSetAnalysis(setBreakdowns: SetBreakdown[]): void {
    this.addSectionHeader('SET-BY-SET ANALYSIS')

    setBreakdowns.forEach((setData, index) => {
      this.checkPageBreak(60)
      
      // Set header with score
      this.doc.setFillColor(...this.colors.light)
      this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 15, 2, 2, 'F')
      
      this.doc.setTextColor(...this.colors.text)
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(`SET ${setData.setNumber}`, this.margin + 5, this.currentY + 10)
      
      this.doc.setFontSize(12)
      this.doc.text(`${setData.score[0]} - ${setData.score[1]}`, this.margin + 60, this.currentY + 10)
      
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`Duration: ${setData.duration}`, this.pageWidth - this.margin - 40, this.currentY + 10, { align: 'right' })
      
      this.currentY += 25

      // Set statistics summary
      const setStatsData = [
        ['Statistic', 'Player 1', 'Player 2'],
        ['First Serve %', `${setData.keyStats.firstServePercentage[0]}%`, `${setData.keyStats.firstServePercentage[1]}%`],
        ['Aces', setData.keyStats.aces[0].toString(), setData.keyStats.aces[1].toString()],
        ['Double Faults', setData.keyStats.doubleFaults[0].toString(), setData.keyStats.doubleFaults[1].toString()],
        ['Winners', setData.keyStats.winners[0].toString(), setData.keyStats.winners[1].toString()],
        ['Unforced Errors', setData.keyStats.unforcedErrors[0].toString(), setData.keyStats.unforcedErrors[1].toString()],
        ['Break Points', `${setData.keyStats.breakPoints.converted[0]}/${setData.keyStats.breakPoints.faced[0]}`, `${setData.keyStats.breakPoints.converted[1]}/${setData.keyStats.breakPoints.faced[1]}`]
      ]

      this.addStyledTable(setStatsData, this.colors.primary)

      // Game progression (only for first 2 sets to save space)
      if (index < 2 && setData.gameBreakdown.length > 0) {
        this.addSubsectionHeader('Game Progression')
        
        const gameData = setData.gameBreakdown.slice(0, 12).map(game => [
          game.gameNumber.toString(),
          game.winner === 'p1' ? 'P1' : 'P2',
          game.score,
          game.isBreak ? '🔥 BREAK' : 'Hold'
        ])

        this.addStyledTable([
          ['Game #', 'Winner', 'Final Score', 'Result'],
          ...gameData
        ], this.colors.secondary)
      }
      
      this.currentY += 10
    })
  }

  private addPointByPointAnalysis(pointByPoint: PointSummary[]): void {
    this.addSectionHeader('POINT-BY-POINT ANALYSIS')

    // Key points summary first
    this.addSubsectionHeader('Critical Points Summary')
    const criticalPoints = pointByPoint.filter(p => p.isBreakPoint || p.isSetPoint || p.isMatchPoint)
    
    if (criticalPoints.length > 0) {
      const criticalData = criticalPoints.slice(0, 15).map(point => [
        point.pointNumber.toString(),
        point.gameScore,
        point.server,
        point.winner,
        point.isMatchPoint ? '🏆 MP' : point.isSetPoint ? '🎆 SP' : '🔥 BP',
        point.description.slice(0, 30) + (point.description.length > 30 ? '...' : '')
      ])

      this.addStyledTable([
        ['Point #', 'Score', 'Server', 'Winner', 'Type', 'Description'],
        ...criticalData
      ], this.colors.error)
    }

    // Detailed point log (first 50 points)
    this.addSubsectionHeader('Detailed Point Log')
    const detailedPoints = pointByPoint.slice(0, 50).map(point => [
      point.pointNumber.toString(),
      point.gameScore,
      point.server.slice(0, 8),
      point.winner.slice(0, 8),
      point.pointType,
      (point.isBreakPoint ? 'BP ' : '') + (point.isSetPoint ? 'SP ' : '') + (point.isMatchPoint ? 'MP' : '')
    ])

    // Split into chunks to avoid overly long tables
    const chunkSize = 25
    for (let i = 0; i < detailedPoints.length; i += chunkSize) {
      const chunk = detailedPoints.slice(i, i + chunkSize)
      const startPoint = i + 1
      const endPoint = Math.min(i + chunkSize, detailedPoints.length)
      
      this.doc.setTextColor(...this.colors.dark)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(`Points ${startPoint}-${endPoint}`, this.margin, this.currentY)
      this.currentY += 8

      this.addStyledTable([
        ['Point', 'Score', 'Server', 'Winner', 'Type', 'Context'],
        ...chunk
      ], this.colors.dark)
      
      if (i + chunkSize < detailedPoints.length) {
        this.currentY += 5
      }
    }
  }

  private addSectionHeader(title: string): void {
    this.checkPageBreak(25)
    
    this.doc.setFillColor(...this.colors.primary)
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 12, 2, 2, 'F')
    
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin + 5, this.currentY + 8)
    
    this.currentY += 20
  }

  private addSubsectionHeader(title: string): void {
    this.doc.setTextColor(...this.colors.dark)
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    
    // Add underline
    this.doc.setDrawColor(...this.colors.secondary)
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, this.currentY + 2, this.margin + 40, this.currentY + 2)
    
    this.currentY += 12
  }

  private addFooter(): void {
    // Add a subtle footer
    this.doc.setTextColor(...this.colors.light)
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Generated by TennisScore App', this.pageWidth / 2, this.pageHeight - 10, { align: 'center' })
    
    // Add page number on first page
    this.doc.setTextColor(...this.colors.light)
    this.doc.setFontSize(8)
    this.doc.text('Page 1', this.pageWidth - this.margin, this.pageHeight - 10, { align: 'right' })
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage()
      this.currentY = 20
    }
  }

  // Helper methods
  private calculateMatchDuration(match: Match): string {
    if (!match.startTime || !match.endTime) return 'N/A'
    const start = new Date(match.startTime)
    const end = new Date(match.endTime)
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60) // minutes
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  private getMatchFormatString(format: MatchFormat): string {
    return `Best of ${format.sets} Sets${format.noAd ? ' (No-Ad)' : ''}`
  }

  private formatFinalScore(match: Match): string {
    return match.score.sets.map(set => `${set[0]}-${set[1]}`).join(', ')
  }

  private extractKeyMoments(pointLog: PointDetail[]): string[] {
    const keyMoments: string[] = []
    
    pointLog.forEach(point => {
      if (point.isMatchPoint && point.isMatchWinning) {
        keyMoments.push(`Match Point: ${point.winner === 'p1' ? 'Player 1' : 'Player 2'} wins at ${point.gameScore}`)
      } else if (point.isSetPoint && point.isSetWinning) {
        keyMoments.push(`Set Point: ${point.winner === 'p1' ? 'Player 1' : 'Player 2'} wins Set ${point.setNumber} at ${point.gameScore}`)
      } else if (point.isBreakPoint && point.isGameWinning) {
        const server = point.server === 'p1' ? 'Player 1' : 'Player 2'
        const winner = point.winner === 'p1' ? 'Player 1' : 'Player 2'
        if (server !== winner) {
          keyMoments.push(`Break of Serve: ${winner} breaks ${server} at ${point.gameScore}`)
        }
      } else if (point.pointOutcome === 'ace') {
        keyMoments.push(`Ace: ${point.winner === 'p1' ? 'Player 1' : 'Player 2'} at ${point.gameScore}`)
      }
    })
    
    return keyMoments.slice(0, 10) // Limit to top 10 moments
  }

  private prepareSetBreakdowns(match: Match, pointLog: PointDetail[], options: ExportOptions): SetBreakdown[] {
    const setBreakdowns: SetBreakdown[] = []
    
    // If live export, only include completed sets
    const completedSets = options.exportType === 'live_set' ? match.score.sets.length : match.score.sets.length
    
    for (let setNum = 1; setNum <= completedSets; setNum++) {
      const setPoints = pointLog.filter(p => p.setNumber === setNum)
      const setScore = match.score.sets[setNum - 1] || [0, 0]
      
      // Calculate games from point log
      const gameBreakdown: GameResult[] = []
      let currentGame = 1
      let currentGamePoints: PointDetail[] = []
      
      setPoints.forEach(point => {
        if (point.gameNumber === currentGame) {
          currentGamePoints.push(point)
        } else {
          // Process completed game
          if (currentGamePoints.length > 0) {
            const gameWinner = currentGamePoints[currentGamePoints.length - 1]
            const isBreak = gameWinner.server !== gameWinner.winner
            gameBreakdown.push({
              gameNumber: currentGame,
              winner: gameWinner.winner,
              score: gameWinner.gameScore,
              isBreak
            })
          }
          currentGame = point.gameNumber
          currentGamePoints = [point]
        }
      })
      
      // Process final game
      if (currentGamePoints.length > 0) {
        const gameWinner = currentGamePoints[currentGamePoints.length - 1]
        const isBreak = gameWinner.server !== gameWinner.winner
        gameBreakdown.push({
          gameNumber: currentGame,
          winner: gameWinner.winner,
          score: gameWinner.gameScore,
          isBreak
        })
      }
      
      // Calculate set stats
      const setStats = calculateMatchStats(setPoints)
      const keyStats: SetStats = {
        firstServePercentage: setStats.firstServePercentageByPlayer as [number, number],
        aces: setStats.acesByPlayer as [number, number],
        doubleFaults: setStats.doubleFaultsByPlayer as [number, number],
        winners: setStats.winnersByPlayer as [number, number],
        unforcedErrors: setStats.unforcedErrorsByPlayer as [number, number],
        breakPoints: {
          faced: setStats.breakPointsByPlayer.faced as [number, number],
          converted: setStats.breakPointsByPlayer.converted as [number, number]
        }
      }
      
      setBreakdowns.push({
        setNumber: setNum,
        score: setScore as [number, number],
        duration: match.setDurations?.[setNum - 1] ? this.formatDuration(match.setDurations[setNum - 1]) : 'N/A',
        gameBreakdown,
        keyStats
      })
    }
    
    return setBreakdowns
  }

  private preparePointByPoint(pointLog: PointDetail[], players: [PlayerInfo, PlayerInfo]): PointSummary[] {
    return pointLog.map(point => ({
      pointNumber: point.pointNumber,
      gameScore: point.gameScore,
      server: point.server === 'p1' ? players[0].name : players[1].name,
      winner: point.winner === 'p1' ? players[0].name : players[1].name,
      pointType: point.pointOutcome || 'winner',
      isBreakPoint: point.isBreakPoint,
      isSetPoint: point.isSetPoint,
      isMatchPoint: point.isMatchPoint,
      description: this.generatePointDescription(point, players),
      timestamp: point.timestamp
    }))
  }

  private generatePointDescription(point: PointDetail, players: [PlayerInfo, PlayerInfo]): string {
    const winner = point.winner === 'p1' ? players[0].name : players[1].name
    const server = point.server === 'p1' ? players[0].name : players[1].name
    
    let description = `${winner} wins`
    
    if (point.pointOutcome === 'ace') {
      description = `${server} serves an ace`
    } else if (point.pointOutcome === 'double_fault') {
      description = `${server} double fault`
    } else if (point.pointOutcome === 'winner') {
      description = `${winner} hits a winner`
    } else if (point.pointOutcome === 'unforced_error') {
      const errorPlayer = point.winner === 'p1' ? players[1].name : players[0].name
      description = `${errorPlayer} unforced error`
    }
    
    if (point.isBreakPoint) description += ' (Break Point)'
    if (point.isSetPoint) description += ' (Set Point)'
    if (point.isMatchPoint) description += ' (Match Point)'
    
    return description
  }

  private formatDuration(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 1000 / 60)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
  }
}

// Export utility functions
export async function exportMatchToPDF(match: Match, playerNames: [string, string], options: ExportOptions): Promise<Blob> {
  // Load PDF libraries before creating exporter
  const { jsPDF } = await loadPDFLibraries()
  
  const exporter = new MatchExporter(jsPDF)
  return await exporter.exportMatch(match, playerNames, options)
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Share functionality
export async function shareMatchReport(blob: Blob, matchTitle: string): Promise<void> {
  const file = new File([blob], `${matchTitle}.pdf`, { type: 'application/pdf' })
  
  if (navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: matchTitle,
        text: 'Check out this tennis match report!'
      })
    } catch (error) {
      console.log('Error sharing:', error)
      // Fallback to download
      downloadPDF(blob, `${matchTitle}.pdf`)
    }
  } else {
    // Fallback for browsers that don't support Web Share API
    downloadPDF(blob, `${matchTitle}.pdf`)
  }
}

// WhatsApp sharing
export function shareToWhatsApp(blob: Blob, matchTitle: string): void {
  // For WhatsApp, we'll need to save the file first and then open WhatsApp
  downloadPDF(blob, `${matchTitle}.pdf`)
  
  // Open WhatsApp with a message
  const message = `Check out this tennis match report: ${matchTitle}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank')
}

// Email sharing
export function shareToEmail(blob: Blob, matchTitle: string): void {
  // For email, we'll download the PDF and compose an email
  downloadPDF(blob, `${matchTitle}.pdf`)
  
  const subject = `Tennis Match Report: ${matchTitle}`
  const body = `Please find attached the tennis match report for ${matchTitle}.`
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoUrl)
}