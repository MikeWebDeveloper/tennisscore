import jsPDF from 'jspdf'
import 'jspdf-autotable'
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
  private doc: jsPDF
  private currentY: number = 20
  private pageWidth: number
  private pageHeight: number
  private margin: number = 20

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
  }

  async exportMatch(match: Match, playerNames: [string, string], options: ExportOptions): Promise<Blob> {
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
    this.addHeader(data.header)
    this.addMatchSummary(data.summary)
    this.addStatisticsTable(data.statistics, data.players)
    
    if (data.detailedStats?.hasDetailedData) {
      this.addDetailedStatistics(data.detailedStats, data.players)
    }
    
    this.addSetBreakdowns(data.setBreakdowns)
    
    if (data.pointByPoint && data.options.includePointByPoint) {
      this.addPointByPointSection(data.pointByPoint)
    }
    
    this.addFooter()
  }

  private generateDetailedReport(data: MatchExportData): void {
    this.generateProfessionalReport(data)
    // Add additional detailed analysis sections
    if (data.detailedStats?.hasDetailedData) {
      this.addAdvancedAnalytics(data.detailedStats, data.players)
    }
  }

  private generateBasicReport(data: MatchExportData): void {
    this.addHeader(data.header)
    this.addMatchSummary(data.summary)
    this.addBasicStatistics(data.statistics, data.players)
    this.addSetBreakdowns(data.setBreakdowns)
    this.addFooter()
  }

  private addHeader(header: MatchReportHeader): void {
    // Title
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(header.title, this.pageWidth / 2, this.currentY, { align: 'center' })
    this.currentY += 15

    // Match details
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`${header.matchDate} • ${header.format}`, this.pageWidth / 2, this.currentY, { align: 'center' })
    this.currentY += 8

    if (header.tournament) {
      this.doc.text(header.tournament, this.pageWidth / 2, this.currentY, { align: 'center' })
      this.currentY += 8
    }

    // Add separator line
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 15
  }

  private addMatchSummary(summary: MatchSummary): void {
    // Winner section
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Winner:', this.margin, this.currentY)
    this.doc.text(summary.winner.name, this.margin + 30, this.currentY)
    this.currentY += 10

    // Final score
    this.doc.setFontSize(14)
    this.doc.text('Final Score:', this.margin, this.currentY)
    this.doc.text(summary.finalScore, this.margin + 35, this.currentY)
    this.currentY += 10

    // Match duration
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Duration: ${summary.matchDuration}`, this.margin, this.currentY)
    this.doc.text(`Total Points: ${summary.totalPoints}`, this.margin + 60, this.currentY)
    this.currentY += 15

    // Key moments
    if (summary.keyMoments.length > 0) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Key Moments:', this.margin, this.currentY)
      this.currentY += 8

      this.doc.setFont('helvetica', 'normal')
      summary.keyMoments.forEach(moment => {
        this.doc.text(`• ${moment}`, this.margin + 5, this.currentY)
        this.currentY += 6
      })
    }

    this.currentY += 10
  }

  private addStatisticsTable(stats: EnhancedMatchStats, players: [PlayerInfo, PlayerInfo]): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Match Statistics', this.margin, this.currentY)
    this.currentY += 10

    const tableData = [
      ['Statistic', players[0].name, players[1].name],
      ['Total Points Won', stats.totalPointsWonByPlayer[0].toString(), stats.totalPointsWonByPlayer[1].toString()],
      ['Service Points Won', `${stats.servicePointsWonByPlayer[0]} (${stats.servicePointsWonPercentageByPlayer[0]}%)`, 
       `${stats.servicePointsWonByPlayer[1]} (${stats.servicePointsWonPercentageByPlayer[1]}%)`],
      ['First Serve %', `${stats.firstServePercentageByPlayer[0]}%`, `${stats.firstServePercentageByPlayer[1]}%`],
      ['First Serve Points Won', `${stats.firstServePointsWonByPlayer[0]}%`, `${stats.firstServePointsWonByPlayer[1]}%`],
      ['Aces', stats.acesByPlayer[0].toString(), stats.acesByPlayer[1].toString()],
      ['Double Faults', stats.doubleFaultsByPlayer[0].toString(), stats.doubleFaultsByPlayer[1].toString()],
      ['Winners', stats.winnersByPlayer[0].toString(), stats.winnersByPlayer[1].toString()],
      ['Unforced Errors', stats.unforcedErrorsByPlayer[0].toString(), stats.unforcedErrorsByPlayer[1].toString()],
      ['Break Points Won', `${stats.breakPointsByPlayer.converted[0]}/${stats.breakPointsByPlayer.faced[0]} (${stats.breakPointsByPlayer.conversionRate[0]}%)`,
       `${stats.breakPointsByPlayer.converted[1]}/${stats.breakPointsByPlayer.faced[1]} (${stats.breakPointsByPlayer.conversionRate[1]}%)`]
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.doc as any).autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: this.currentY,
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [40, 40, 40],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 50, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' }
      },
      margin: { left: this.margin, right: this.margin }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addBasicStatistics(stats: EnhancedMatchStats, players: [PlayerInfo, PlayerInfo]): void {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Basic Statistics', this.margin, this.currentY)
    this.currentY += 10

    const tableData = [
      ['Statistic', players[0].name, players[1].name],
      ['Total Points Won', stats.totalPointsWonByPlayer[0].toString(), stats.totalPointsWonByPlayer[1].toString()],
      ['Service Points Won', `${stats.servicePointsWonPercentageByPlayer[0]}%`, `${stats.servicePointsWonPercentageByPlayer[1]}%`],
      ['Return Points Won', `${stats.receivingPointsWonPercentageByPlayer[0]}%`, `${stats.receivingPointsWonPercentageByPlayer[1]}%`],
      ['Break Points Converted', `${stats.breakPointsByPlayer.conversionRate[0]}%`, `${stats.breakPointsByPlayer.conversionRate[1]}%`]
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.doc as any).autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: this.currentY,
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [40, 40, 40],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 50, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' }
      },
      margin: { left: this.margin, right: this.margin }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addDetailedStatistics(stats: DetailedMatchStats, players: [PlayerInfo, PlayerInfo]): void {
    if (!stats.hasDetailedData) return

    this.checkPageBreak(60)

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Detailed Analysis', this.margin, this.currentY)
    this.currentY += 15

    // Serve Direction Analysis
    if (stats.serveDirectionStats.playerOne.totalAttempts > 0 || stats.serveDirectionStats.playerTwo.totalAttempts > 0) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Serve Direction Analysis', this.margin, this.currentY)
      this.currentY += 10

      const serveData = [
        ['Direction', `${players[0].name} (Success Rate)`, `${players[1].name} (Success Rate)`],
        ['Wide', 
         `${stats.serveDirectionStats.playerOne.wide.attempts} (${stats.serveDirectionStats.playerOne.wide.attempts > 0 ? Math.round((stats.serveDirectionStats.playerOne.wide.successful / stats.serveDirectionStats.playerOne.wide.attempts) * 100) : 0}%)`,
         `${stats.serveDirectionStats.playerTwo.wide.attempts} (${stats.serveDirectionStats.playerTwo.wide.attempts > 0 ? Math.round((stats.serveDirectionStats.playerTwo.wide.successful / stats.serveDirectionStats.playerTwo.wide.attempts) * 100) : 0}%)`],
        ['Body', 
         `${stats.serveDirectionStats.playerOne.body.attempts} (${stats.serveDirectionStats.playerOne.body.attempts > 0 ? Math.round((stats.serveDirectionStats.playerOne.body.successful / stats.serveDirectionStats.playerOne.body.attempts) * 100) : 0}%)`,
         `${stats.serveDirectionStats.playerTwo.body.attempts} (${stats.serveDirectionStats.playerTwo.body.attempts > 0 ? Math.round((stats.serveDirectionStats.playerTwo.body.successful / stats.serveDirectionStats.playerTwo.body.attempts) * 100) : 0}%)`],
        ['T (Center)', 
         `${stats.serveDirectionStats.playerOne.t.attempts} (${stats.serveDirectionStats.playerOne.t.attempts > 0 ? Math.round((stats.serveDirectionStats.playerOne.t.successful / stats.serveDirectionStats.playerOne.t.attempts) * 100) : 0}%)`,
         `${stats.serveDirectionStats.playerTwo.t.attempts} (${stats.serveDirectionStats.playerTwo.t.attempts > 0 ? Math.round((stats.serveDirectionStats.playerTwo.t.successful / stats.serveDirectionStats.playerTwo.t.attempts) * 100) : 0}%)`]
      ]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.doc as any).autoTable({
        head: [serveData[0]],
        body: serveData.slice(1),
        startY: this.currentY,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [60, 60, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 50, halign: 'center' },
          2: { cellWidth: 50, halign: 'center' }
        },
        margin: { left: this.margin, right: this.margin }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
    }

    // Pressure Point Performance
    const pressureStats = stats.contextualStats.pressurePointPerformance
    if (pressureStats.breakPoints.total > 0 || pressureStats.setPoints.total > 0) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Pressure Point Performance', this.margin, this.currentY)
      this.currentY += 10

      const pressureData = [
        ['Situation', 'Total', 'Won', 'Success Rate'],
        ['Break Points', pressureStats.breakPoints.total.toString(), pressureStats.breakPoints.won.toString(), `${pressureStats.breakPoints.percentage}%`],
        ['Set Points', pressureStats.setPoints.total.toString(), pressureStats.setPoints.won.toString(), `${pressureStats.setPoints.percentage}%`],
        ['Match Points', pressureStats.matchPoints.total.toString(), pressureStats.matchPoints.won.toString(), `${pressureStats.matchPoints.percentage}%`]
      ]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.doc as any).autoTable({
        head: [pressureData[0]],
        body: pressureData.slice(1),
        startY: this.currentY,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [60, 60, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: this.margin, right: this.margin }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
    }
  }

  private addAdvancedAnalytics(stats: DetailedMatchStats, players: [PlayerInfo, PlayerInfo]): void {
    this.checkPageBreak(40)

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Advanced Analytics', this.margin, this.currentY)
    this.currentY += 15

    // Shot direction analysis
    if (stats.shotDirectionStats.playerOne.totalShots > 0 || stats.shotDirectionStats.playerTwo.totalShots > 0) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Shot Direction Patterns', this.margin, this.currentY)
      this.currentY += 10

      const shotData = [
        ['Direction', `${players[0].name} (W/E)`, `${players[1].name} (W/E)`],
        ['Cross Court', 
         `${stats.shotDirectionStats.playerOne.crossCourt.attempts} (${stats.shotDirectionStats.playerOne.crossCourt.winners}/${stats.shotDirectionStats.playerOne.crossCourt.errors})`,
         `${stats.shotDirectionStats.playerTwo.crossCourt.attempts} (${stats.shotDirectionStats.playerTwo.crossCourt.winners}/${stats.shotDirectionStats.playerTwo.crossCourt.errors})`],
        ['Down the Line', 
         `${stats.shotDirectionStats.playerOne.downTheLine.attempts} (${stats.shotDirectionStats.playerOne.downTheLine.winners}/${stats.shotDirectionStats.playerOne.downTheLine.errors})`,
         `${stats.shotDirectionStats.playerTwo.downTheLine.attempts} (${stats.shotDirectionStats.playerTwo.downTheLine.winners}/${stats.shotDirectionStats.playerTwo.downTheLine.errors})`],
        ['Body Shots', 
         `${stats.shotDirectionStats.playerOne.body.attempts} (${stats.shotDirectionStats.playerOne.body.winners}/${stats.shotDirectionStats.playerOne.body.errors})`,
         `${stats.shotDirectionStats.playerTwo.body.attempts} (${stats.shotDirectionStats.playerTwo.body.winners}/${stats.shotDirectionStats.playerTwo.body.errors})`]
      ]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.doc as any).autoTable({
        head: [shotData[0]],
        body: shotData.slice(1),
        startY: this.currentY,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [60, 60, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 50, halign: 'center' },
          2: { cellWidth: 50, halign: 'center' }
        },
        margin: { left: this.margin, right: this.margin }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
    }
  }

  private addSetBreakdowns(setBreakdowns: SetBreakdown[]): void {
    this.checkPageBreak(40)

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Set-by-Set Breakdown', this.margin, this.currentY)
    this.currentY += 15

    setBreakdowns.forEach(setData => {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(`Set ${setData.setNumber}: ${setData.score[0]}-${setData.score[1]} (${setData.duration})`, this.margin, this.currentY)
      this.currentY += 10

      // Game-by-game breakdown
      const gameData = setData.gameBreakdown.map(game => [
        game.gameNumber.toString(),
        game.winner === 'p1' ? 'Player 1' : 'Player 2',
        game.score,
        game.isBreak ? 'Break' : 'Hold'
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.doc as any).autoTable({
        head: [['Game', 'Winner', 'Score', 'Type']],
        body: gameData,
        startY: this.currentY,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [80, 80, 80],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: this.margin, right: this.margin }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
    })
  }

  private addPointByPointSection(pointByPoint: PointSummary[]): void {
    this.checkPageBreak(40)

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Point-by-Point Log', this.margin, this.currentY)
    this.currentY += 15

    // Group points by set
    const pointsBySet = pointByPoint.reduce((acc, point) => {
      const setNum = Math.floor((point.pointNumber - 1) / 100) + 1 // Rough estimation
      if (!acc[setNum]) acc[setNum] = []
      acc[setNum].push(point)
      return acc
    }, {} as Record<number, PointSummary[]>)

    Object.entries(pointsBySet).forEach(([setNum, points]) => {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(`Set ${setNum} Points`, this.margin, this.currentY)
      this.currentY += 10

      const pointData = points.slice(0, 20).map(point => [
        point.pointNumber.toString(),
        point.gameScore,
        point.server,
        point.winner,
        point.pointType,
        point.isBreakPoint ? 'BP' : (point.isSetPoint ? 'SP' : (point.isMatchPoint ? 'MP' : ''))
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.doc as any).autoTable({
        head: [['Point', 'Game Score', 'Server', 'Winner', 'Type', 'Context']],
        body: pointData,
        startY: this.currentY,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [100, 100, 100],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 30, halign: 'center' },
          5: { cellWidth: 15, halign: 'center' }
        },
        margin: { left: this.margin, right: this.margin }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
    })
  }

  private addFooter(): void {
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Generated by TennisScore App', this.pageWidth / 2, this.pageHeight - 10, { align: 'center' })
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
  const exporter = new MatchExporter()
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