#!/usr/bin/env node

/**
 * Test script for lucide import optimization
 */

const { iconNameToKebabCase, parseLucideImports, generateIndividualImports } = require('./optimize-lucide-imports')

// Test icon name to kebab-case conversion
console.log('🧪 Testing icon name conversion:')
const testIcons = [
  'Home',
  'ChevronDown',
  'AlertTriangle',
  'ArrowUpDown',
  'TestTube2',
  'WifiOff',
  'XIcon',
  'CheckIcon'
]

testIcons.forEach(icon => {
  const kebab = iconNameToKebabCase(icon)
  console.log(`  ${icon} → ${kebab}`)
})

// Test import parsing
console.log('\n🧪 Testing import parsing:')
const testContent = `
import React from 'react'
import { Home, Menu, X, ChevronDown } from "lucide-reaimport { Home } from "lucide-react"
import { Menu } from "lucide-react"
import { X } from "lucide-react"
import { ChevronDown } from "lucide-react"gle } from "lucide-react"
import { RefreshCw } from "lucide-react"
import { Settings } from "lucide-react"
import { Card } from './card'
`

const imports = parseLucideImports(testContent)
console.log(`  Found ${imports.length} lucide import blocks:`)
imports.forEach((imp, index) => {
  console.log(`    Block ${index + 1}: [${imp.icons.join(', ')}]`)
})

// Test individual import generation
console.log('\n🧪 Testing individual import generation:')
const sampleIcons = ['Home', 'ChevronDown', 'AlertTriangle']
const individualImports = generateIndividualImports(sampleIcons)
console.log('Generated imports:')
console.log(individualImports)

console.log('\n✅ All tests completed!')