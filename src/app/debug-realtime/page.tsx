"use client"

import { useState, useEffect } from "react"
import { client, databases } from "@/lib/appwrite-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateMatchScore } from "@/lib/actions/matches"

export default function DebugRealtime() {
  const [events, setEvents] = useState<any[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matchId, setMatchId] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const subscribeToMatch = () => {
    if (!matchId) {
      setError("Please enter a match ID")
      return
    }

    setError(null)
    setEvents([])
    
    try {
      const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim()
      const collectionId = process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID?.trim()
      
      if (!dbId || !collectionId) {
        throw new Error("Missing environment variables")
      }

      const channel = `databases.${dbId}.collections.${collectionId}.documents.${matchId}`
      
      console.log("Subscribing to channel:", channel)
      
      const unsubscribe = client.subscribe(
        channel,
        (response) => {
          console.log("Event received:", response)
          setEvents(prev => [...prev, {
            time: new Date().toISOString(),
            event: response
          }])
          setConnected(true)
        }
      )

      setConnected(true)
      
      // Clean up on unmount
      return () => {
        unsubscribe()
        setConnected(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect")
      setConnected(false)
    }
  }

  const testUpdate = async () => {
    if (!matchId) {
      setError("Please enter a match ID")
      return
    }

    setIsUpdating(true)
    try {
      // Test update with minimal data
      const result = await updateMatchScore(matchId, {
        score: {
          sets: [],
          games: [0, 0],
          points: [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)],
          isTiebreak: false,
          tiebreakPoints: [0, 0]
        },
        pointLog: [{
          timestamp: new Date().toISOString(),
          test: true,
          random: Math.random()
        }]
      })

      if (result.error) {
        setError(`Update failed: ${result.error}`)
      } else {
        console.log("Update successful:", result)
      }
    } catch (err) {
      setError(`Update error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Real-time Debug Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Match ID:
              </label>
              <input
                type="text"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter match ID"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={subscribeToMatch}>
                Subscribe to Match
              </Button>
              <Button 
                onClick={testUpdate} 
                disabled={isUpdating}
                variant="secondary"
              >
                {isUpdating ? "Updating..." : "Test Update"}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Status: </span>
                <span className={connected ? "text-green-500" : "text-red-500"}>
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              
              {error && (
                <div className="text-sm text-red-500">
                  Error: {error}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <div>Database ID: {process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}</div>
                <div>Collection ID: {process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID}</div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2">Events ({events.length})</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {events.map((event, i) => (
                  <div key={i} className="p-2 bg-muted rounded text-xs">
                    <div className="font-medium">{event.time}</div>
                    <pre className="mt-1 overflow-x-auto">
                      {JSON.stringify(event.event, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}