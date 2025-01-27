# Satisfactories User Guide

Welcome to Satisfactories! This guide will help you get the most out of your factory planning and management tool.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Managing Worlds](#managing-worlds)
3. [Factory Management](#factory-management)
4. [Resource Management](#resource-management)
5. [Power Management](#power-management)
6. [Tips & Tricks](#tips--tricks)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### First Time Setup

1. Visit [satisfactories.app](https://satisfactories.app)
2. (Optional) Install as PWA for offline access:
   - Click the "Install" button in your browser's address bar
   - Follow the prompts to add to your home screen

### App Overview

The main dashboard shows:
- Your worlds list
- Quick access to recent factories
- Total production statistics
- Power consumption overview

## Managing Worlds

### Creating a New World

1. Click the "+" button in the worlds section
2. Fill in the details:
   - World Name (required)
   - Biome
   - Game Version
   - Difficulty Setting
   - Map Coordinates
   - Tags (for organization)
3. Add notes if desired (supports Markdown)
4. Click "Create World"

### World Settings

Each world tracks:
- Total power production/consumption
- Resource inputs/outputs across all factories
- Factory locations and status
- Production efficiency metrics

### World Tags

Use tags to organize your worlds:
- Production focus (e.g., "Steel Production", "Space Elevator")
- Game phase (e.g., "Early Game", "Tier 7-8")
- Status (e.g., "Active", "Planning", "Complete")

## Factory Management

### Creating Factories

1. Select a world
2. Click "Add Factory"
3. Fill in factory details:
   - Name and Description
   - Category (Mining, Processing, etc.)
   - Location Coordinates
   - Status (Operational, Under Construction, etc.)
   - Power Requirements
   - Building Counts

### Resource Configuration

For each factory, configure:

#### Inputs
- Resource Type
- Purity Level (for extractors)
- Amount and Rate
- Transport Method
- Maximum Capacity
- Current Efficiency

#### Outputs
- Resource Type
- Production Rate
- Transport Method
- Efficiency Metrics

### Building Management

Track building counts for each factory:
- Constructors
- Assemblers
- Manufacturers
- Power Buildings
- Storage Containers

## Resource Management

### Resource Types

The system supports all game resources:
- Raw Materials (Ore, Oil, etc.)
- Intermediate Products (Ingots, Plates, etc.)
- Final Products (Motors, Computers, etc.)

### Transport Methods

Track how resources move between factories:
- Conveyor Belts (with mk levels)
- Trucks
- Trains
- Drones
- Pipes (for liquids/gas)

### Efficiency Tracking

Monitor production efficiency:
- Input vs Output rates
- Maximum theoretical rates
- Current operational rates
- Bottleneck identification

## Power Management

### Power Grid

Track power metrics:
- Total Production Capacity
- Current Consumption
- Peak Usage
- Available Headroom

### Power Sources

Monitor different power sources:
- Coal Generators
- Fuel Generators
- Nuclear Power Plants
- Other Power Sources

## Tips & Tricks

### Efficient Factory Planning

1. **Start with the End Goal**
   - Determine final product
   - Calculate required resources
   - Plan backward from there

2. **Location Planning**
   - Consider resource node proximity
   - Plan for expansion
   - Account for transport distances

3. **Power Management**
   - Build power headroom
   - Separate grids for critical systems
   - Monitor efficiency metrics

### Organization Tips

1. **Use Tags Effectively**
   - Tag worlds by purpose
   - Tag factories by production chain
   - Use consistent naming conventions

2. **Documentation**
   - Use markdown notes
   - Add screenshots
   - Document ratios and calculations

3. **Regular Updates**
   - Update production numbers
   - Track efficiency changes
   - Document modifications

## Troubleshooting

### Common Issues

1. **Data Not Saving**
   - Check browser storage settings
   - Ensure you're not in private browsing
   - Clear space if storage is full

2. **Performance Issues**
   - Reduce number of visible factories
   - Use tags for better organization
   - Clear browser cache

3. **Calculation Errors**
   - Verify input/output rates
   - Check building efficiency
   - Confirm power numbers

### Data Recovery

The app automatically:
- Compresses data to save space
- Creates backups of important changes
- Maintains data integrity

To recover data:
1. Check browser storage
2. Look for backup data
3. Contact support if needed

## Keyboard Shortcuts

- `N` - New World
- `F` - New Factory
- `Ctrl + S` - Save Changes
- `Esc` - Close Modal
- `Tab` - Navigate Forms
- `/` - Search

## Getting Help

If you need assistance:
1. Check this documentation
2. Search existing issues
3. Join our Discord community
4. Create a support ticket

Remember to:
- Provide clear details
- Include screenshots if relevant
- Share world/factory data if needed

---

For technical details, see our [Architecture Overview](ARCHITECTURE.md) and [Contributing Guidelines](CONTRIBUTING.md).
