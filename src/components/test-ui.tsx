import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function TestUI() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Test Component</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Test Button</Button>
      </CardContent>
    </Card>
  )
}
