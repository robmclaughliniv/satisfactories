-- Migration Version: 20250216_001
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enhanced Migration Script for Satisfactories Database
-- Drops existing tables before creating new ones with expanded schema
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS factories;
DROP TABLE IF EXISTS worlds;
DROP TABLE IF EXISTS users;

-- Users table for storing user preferences
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    theme VARCHAR(50),
    default_game_version VARCHAR(50),
    default_difficulty VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Worlds table with enhanced properties
CREATE TABLE worlds (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    metadata JSONB, -- stores biome, coordinates, etc.
    game_version VARCHAR(50),
    difficulty VARCHAR(50),
    tags TEXT[],
    power_stats JSONB, -- e.g., totalProduction, totalConsumption, maxCapacity
    start_date TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Factories table now linked to worlds, capturing additional factory details
CREATE TABLE factories (
    id SERIAL PRIMARY KEY,
    world_id INTEGER REFERENCES worlds(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    operational_status VARCHAR(50),
    location VARCHAR(255),
    power_management JSONB,
    building_counts JSONB,
    efficiency_tracking JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resources table remains for linking resource information to worlds
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    world_id INTEGER REFERENCES worlds(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
