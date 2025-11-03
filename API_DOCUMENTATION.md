# Mindhive AI Assistant - API Documentation

Complete API specification for the Mindhive AI Assistant backend, including endpoint details, request/response schemas, and integration flows.

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication & Setup](#authentication--setup)
3. [Core Endpoints](#core-endpoints)
4. [RAG Endpoint](#rag-endpoint)
5. [Text2SQL Endpoint](#text2sql-endpoint)
6. [Response Schemas](#response-schemas)
7. [Error Handling](#error-handling)
8. [Flow Diagrams](#flow-diagrams)
9. [Integration Examples](#integration-examples)

---

## API Overview

**Base URL:** `http://localhost:8000`  
**Protocol:** HTTP REST  
**Content-Type:** `application/json`  
**Documentation:** `http://localhost:8000/docs` (Swagger UI)

### Available Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/chat` | Main chat endpoint with intent detection and tool routing |
| POST | `/health` | Check API health and service status |
| GET | `/products` | Search products (RAG-based) |
| GET | `/outlets` | Search outlets (Text2SQL-based) |
| POST | `/calculate` | Safe calculator evaluation |

---

## Authentication & Setup

### No Authentication Required

All endpoints are public and do not require authentication tokens. For production deployment, implement API key validation.

### CORS Configuration

Backend supports CORS for frontend at `http://localhost:3000` and `http://localhost:5173` (Vite default).

---

## Core Endpoints

### 1. Chat Endpoint

**Endpoint:** `POST /chat`

**Purpose:** Multi-turn conversation with intent detection and tool routing

**Request:**
```json
{
  "user_id": "user_123",
  "message": "Find glass coffee cups in Petaling Jaya"
}
```

**Request Schema:**
```
user_id (string, required): Unique user identifier
message (string, required): User input message
```

**Response:**
```json
{
  "response": "We have glass coffee cups available! Here are our locations in Petaling Jaya...",
  "intent": "products_and_outlets",
  "tools_used": ["ProductKB", "OutletsDB"],
  "timestamp": "2024-11-03T10:30:45.123Z",
  "conversation_state": {
    "location": "Petaling Jaya",
    "product_category": "drinkware",
    "recent_turns": 3
  }
}
```

**Response Schema:**
```
response (string): Generated response text
intent (string): Detected user intent (calculator|products|outlets|general|multi)
tools_used (array): Tools activated for this request
timestamp (ISO string): Server-side timestamp
conversation_state (object): Context for multi-turn conversations
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid input
- `500 Internal Server Error` - Backend error

**Example cURL:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "message": "Calculate 15 + 25 * 2"
  }'
```

---

### 2. Health Check Endpoint

**Endpoint:** `POST /health`

**Purpose:** Monitor API health and service status

**Request:**
```json
{}
```

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "chat": "healthy",
    "products": "operational",
    "outlets": "healthy"
  },
  "timestamp": "2024-11-03T10:30:45.123Z",
  "uptime_seconds": 3600
}
```

**Status Codes:**
- `200 OK` - All services healthy
- `503 Service Unavailable` - One or more services down

**Example cURL:**
```bash
curl -X POST http://localhost:8000/health
```

---

## RAG Endpoint

### Product Search (RAG-Based)

**Endpoint:** `GET /products`

**Purpose:** Search product catalog using keyword-based retrieval

**Query Parameters:**
```
query (string, required): Search keywords
limit (integer, optional): Max results (default: 5)
```

**Request:**
```
GET /products?query=glass+cup&limit=10
```

**Response:**
```json
{
  "products": [
    {
      "id": "prod_001",
      "name": "Glass Coffee Cup",
      "category": "drinkware",
      "price": "RM 45.00",
      "description": "Borosilicate glass, heat-resistant, 250ml capacity",
      "relevance_score": 0.95
    },
    {
      "id": "prod_002",
      "name": "Double-Wall Glass Cup",
      "category": "drinkware",
      "price": "RM 55.00",
      "description": "Thermal insulation, prevents hand burns",
      "relevance_score": 0.87
    }
  ],
  "query": "glass cup",
  "total_results": 5,
  "search_time_ms": 12
}
```

**RAG Architecture:**

```
User Query: "glass cup"
    ↓
[Tokenization & Preprocessing]
    ↓
[Keyword Extraction]
    ↓
[Product KB Retrieval]
    ├─ Field 1: name (weight: 0.4)
    ├─ Field 2: description (weight: 0.3)
    ├─ Field 3: category (weight: 0.3)
    ↓
[Relevance Scoring]
    ├─ Exact match: +1.0
    ├─ Partial match: +0.7
    ├─ Fuzzy match: +0.5
    ↓
[Sort by Score & Limit Results]
    ↓
Response: [Product 1, Product 2, ...]
```

**Product KB Schema:**
```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "price": "string",
  "description": "string",
  "tags": ["string"]
}
```

**Example cURL:**
```bash
curl "http://localhost:8000/products?query=glass+cup&limit=5"
```

**Trade-offs:**
- ✅ Fast, no ML model needed
- ❌ Limited to keyword matching, doesn't understand semantics
- 🔄 Alternative: Use embeddings (Sentence-BERT) for semantic search

---

## Text2SQL Endpoint

### Outlet Search (Text2SQL-Based)

**Endpoint:** `GET /outlets`

**Purpose:** Natural language to SQL conversion for outlet queries

**Query Parameters:**
```
query (string, required): Natural language query
limit (integer, optional): Max results (default: 10)
```

**Request:**
```
GET /outlets?query=outlets+in+Klang&limit=5
```

**Response:**
```json
{
  "outlets": [
    {
      "id": "outlet_001",
      "name": "ZUS Coffee Klang",
      "location": "Klang",
      "address": "Jln Merdeka, Klang",
      "hours": "8:00 AM - 10:00 PM",
      "services": ["wifi", "parking", "outdoor_seating"]
    },
    {
      "id": "outlet_002",
      "name": "ZUS Coffee Sentosa",
      "location": "Klang",
      "address": "Sentosa Mall, Klang",
      "hours": "9:00 AM - 9:30 PM",
      "services": ["wifi", "indoor_seating"]
    }
  ],
  "query": "outlets in Klang",
  "sql_generated": "SELECT * FROM outlets WHERE location LIKE '%Klang%' LIMIT 5",
  "total_results": 2,
  "execution_time_ms": 8
}
```

**Text2SQL Architecture:**

```
Natural Language Query: "Find outlets in Klang with parking"
    ↓
[Intent Recognition]
    ├─ Entity: location = "Klang"
    ├─ Entity: service = "parking"
    ↓
[Pattern Matching]
    ├─ Pattern: "outlets in {location}"
    ├─ Pattern: "with {service}"
    ↓
[SQL Template Selection]
    SELECT * FROM outlets 
    WHERE location LIKE ? 
    AND services LIKE ?
    ↓
[Parameter Binding]
    └─ location = "Klang", services = "parking"
    ↓
[SQL Injection Prevention]
    ├─ Whitelist check (no DROP, DELETE, etc)
    ├─ Parameterized queries
    ├─ Input validation
    ↓
[Query Execution]
    ↓
Response: [Outlet 1, Outlet 2, ...]
```

**Supported Patterns:**
```
"outlets in {location}"
"find {location} outlets"
"outlets with {service}"
"near {location}"
"closest outlets"
"{location} locations"
```

**Outlets Database Schema:**
```json
{
  "id": "string",
  "name": "string",
  "location": "string",
  "address": "string",
  "hours": "string",
  "services": ["string"]
}
```

**Supported Services:**
- `wifi` - Free WiFi available
- `parking` - Parking available
- `outdoor_seating` - Outdoor seating
- `indoor_seating` - Indoor seating
- `wheelchair_accessible` - Accessible

**Example cURL:**
```bash
curl "http://localhost:8000/outlets?query=outlets+in+Klang+with+wifi"
```

**SQL Injection Prevention:**
- ✅ Parameterized queries (no string concatenation)
- ✅ Whitelist of allowed SQL keywords
- ✅ Input validation and sanitization
- ✅ No dynamic table/column names

**Trade-offs:**
- ✅ Prevents SQL injection, deterministic results
- ❌ Limited to predefined patterns
- 🔄 Alternative: LLM-based Text2SQL (Claude/GPT) for flexibility

---

## Response Schemas

### Success Response (200)

```json
{
  "response": "string",
  "intent": "string",
  "tools_used": ["string"],
  "timestamp": "ISO8601",
  "conversation_state": {
    "location": "string",
    "product_category": "string",
    "recent_turns": "number"
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "error": "string",
  "error_code": "string",
  "message": "string",
  "timestamp": "ISO8601"
}
```

**Error Codes:**
- `INVALID_INPUT` - Missing required fields
- `API_ERROR` - Backend service error
- `DATABASE_ERROR` - Database query failed
- `SYNTAX_ERROR` - Calculator syntax error
- `UNKNOWN_ERROR` - Unexpected error

---

## Error Handling

### Common Errors & Solutions

**400 Bad Request**
```json
{
  "error": "INVALID_INPUT",
  "message": "user_id and message are required"
}
```
**Solution:** Ensure both `user_id` and `message` fields are provided

**500 Internal Server Error**
```json
{
  "error": "API_ERROR",
  "message": "Failed to process message"
}
```
**Solution:** Check backend logs, verify database connection

**503 Service Unavailable**
```json
{
  "error": "SERVICE_DOWN",
  "message": "Products service is currently offline"
}
```
**Solution:** Restart backend, check service health

---

## Flow Diagrams

### Chat Flow - Complete User Journey

```
┌─────────────────────────────────────────────────────────┐
│           User Types Message in Frontend                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │  Message Sent to Backend   │
        │  POST /chat (user_id, msg) │
        └────────────┬───────────────┘
                     │
                     ↓
        ┌────────────────────────────────────┐
        │   Backend: Intent Detection        │
        │ (Keyword pattern matching)         │
        └────────┬───────────────────────────┘
                 │
        ┌────────┴──────────────────────────────┐
        │                                       │
        ↓                                       ↓
   ┌─────────────┐                      ┌──────────────┐
   │ Calculator? │                      │ Products?    │
   │ /calc 15+25 │                      │ glass cups   │
   └──────┬──────┘                      └──────┬───────┘
          │                                     │
          ↓                              ┌──────┴────────┐
    ┌──────────────────┐                │               │
    │ CalculatorTool   │        ┌───────▼────────┐  ┌──▼──────┐
    │ Safe eval()      │        │ ProductKB      │  │Outlets? │
    │ Whitelist chars  │        │ RAG Search     │  │Klang    │
    └────────┬─────────┘        └───────┬────────┘  └──┬──────┘
             │                          │              │
             ↓                          ↓              ↓
        ┌─────────────┐         ┌────────────────┐  ┌──────────────┐
        │  Result:    │         │ Found Products:│  │ OutletsDB    │
        │   25 + 350  │         │ 1. Glass Cup   │  │ Text2SQL     │
        │   = 375     │         │ 2. Mug Glass   │  │ Query outlets│
        └─────┬───────┘         └────────┬───────┘  └──────┬───────┘
              │                          │                  │
              └──────────────┬───────────┴──────────────────┘
                             │
                             ↓
                ┌──────────────────────────────┐
                │  Generate Natural Response   │
                │  from Tool Results           │
                └──────────────┬───────────────┘
                               │
                               ↓
                ┌──────────────────────────────┐
                │  Return to Frontend          │
                │ {response, intent, tools}    │
                └──────────────┬───────────────┘
                               │
                               ↓
                ┌──────────────────────────────┐
                │ Frontend Renders Response    │
                │ Shows in Chat Bubble         │
                └──────────────────────────────┘
```

### Intent Detection Flow

```
User Message: "Calculate 15 + 25 and show me glass cups"
         │
         ↓
    ┌─────────────────────────┐
    │ Pattern Matching        │
    ├─────────────────────────┤
    │ /calculate/             │ ← Match!
    │ /product/glass/         │ ← Match!
    │ /outlet/                │ ✗ No match
    └────────┬────────────────┘
             │
             ↓
    ┌──────────────────────┐
    │ Intent: "multi"      │
    │ Tools: [Calculator,  │
    │         ProductKB]   │
    └──────────────────────┘
```

### RAG Search Flow (Products)

```
Query: "glass cup"
    │
    ├─ Tokenize: ["glass", "cup"]
    │
    ├─ Search across products:
    │  ├─ Product 1: "Glass Coffee Cup" → Match (name)
    │  │  Score: 0.95
    │  ├─ Product 2: "Double-Wall Glass" → Partial match
    │  │  Score: 0.87
    │  └─ Product 3: "Metal Cup" → No match
    │  │  Score: 0.0
    │
    └─ Return sorted: [Product1, Product2]
```

### Text2SQL Flow (Outlets)

```
Query: "Find outlets in Klang with parking"
    │
    ├─ Extract entities:
    │  ├─ Location: "Klang"
    │  └─ Service: "parking"
    │
    ├─ Match pattern:
    │  "outlets in {location} with {service}"
    │
    ├─ Generate SQL:
    │  SELECT * FROM outlets
    │  WHERE location LIKE ? 
    │  AND services LIKE ?
    │
    ├─ Bind parameters:
    │  location = "Klang"
    │  services = "parking"
    │
    ├─ Execute & validate results
    │
    └─ Return: [Outlet1, Outlet2]
```

### Conversation Memory Flow

```
┌─────────────────────────────────────┐
│ Turn 1: "Find outlets in Klang"     │
├─────────────────────────────────────┤
│ Storage: {                          │
│   location: "Klang",                │
│   recent_turns: 1                   │
│ }                                   │
└────────────────┬────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│ Turn 2: "Show glass cups there"     │
├─────────────────────────────────────┤
│ Context Retrieved: location="Klang" │
│ Enhanced Query: "Show glass cups    │
│ in Klang"                           │
│ Storage: {                          │
│   location: "Klang",                │
│   product_category: "drinkware",    │
│   recent_turns: 2                   │
│ }                                   │
└────────────────┬────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│ Turn 3: "Which has parking?"        │
├─────────────────────────────────────┤
│ Context Retrieved:                  │
│ location="Klang",                   │
│ product_category="drinkware"        │
│ Enhanced Query: "Which outlets      │
│ in Klang with glass cups have       │
│ parking?"                           │
└─────────────────────────────────────┘
```

---

## Integration Examples

### Example 1: Calculate Expression

**Request:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_001",
    "message": "Calculate 100 / 4 + 5 * 2"
  }'
```

**Response:**
```json
{
  "response": "100 / 4 + 5 * 2 = 25 + 10 = 35",
  "intent": "calculator",
  "tools_used": ["CalculatorTool"],
  "timestamp": "2024-11-03T10:30:45.123Z",
  "conversation_state": {
    "location": null,
    "product_category": null,
    "recent_turns": 1
  }
}
```

### Example 2: Product Search via RAG

**Request:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_002",
    "message": "What glass drinkware do you have?"
  }'
```

**Response:**
```json
{
  "response": "We have several glass drinkware options:\n\n1. Glass Coffee Cup - RM 45.00\n   Borosilicate glass, heat-resistant, 250ml\n\n2. Double-Wall Glass Cup - RM 55.00\n   Thermal insulation, prevents hand burns",
  "intent": "products",
  "tools_used": ["ProductKB"],
  "timestamp": "2024-11-03T10:31:20.456Z",
  "conversation_state": {
    "product_category": "drinkware",
    "recent_turns": 1
  }
}
```

### Example 3: Outlet Search via Text2SQL

**Request:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_003",
    "message": "Find me outlets in Petaling Jaya with WiFi"
  }'
```

**Response:**
```json
{
  "response": "Found 2 outlets in Petaling Jaya with WiFi:\n\n1. ZUS Coffee PJ Paradigm - 8am-10pm\n   Address: Paradigm Mall, Petaling Jaya\n   Services: WiFi, Parking, Indoor Seating\n\n2. ZUS Coffee Jaya One - 7am-9pm\n   Address: Jaya One, Petaling Jaya\n   Services: WiFi, Outdoor Seating",
  "intent": "outlets",
  "tools_used": ["OutletsDB"],
  "timestamp": "2024-11-03T10:32:15.789Z",
  "conversation_state": {
    "location": "Petaling Jaya",
    "recent_turns": 1
  }
}
```

### Example 4: Multi-Tool Request

**Request:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_004",
    "message": "Calculate the total: 3 glass cups at RM45 each, and find outlets near Klang"
  }'
```

**Response:**
```json
{
  "response": "Calculation: 3 × 45 = RM 135 total\n\nOutlets near Klang:\n\n1. ZUS Coffee Klang - 8am-10pm\n   Jln Merdeka, Klang\n   Services: WiFi, Parking, Outdoor Seating\n\n2. ZUS Coffee Sentosa - 9am-9:30pm\n   Sentosa Mall, Klang\n   Services: WiFi, Indoor Seating",
  "intent": "multi",
  "tools_used": ["CalculatorTool", "OutletsDB"],
  "timestamp": "2024-11-03T10:33:45.012Z",
  "conversation_state": {
    "location": "Klang",
    "product_category": "drinkware",
    "recent_turns": 1
  }
}
```

---

**Version:** 2.0.0  
**Last Updated:** November 2024  
**Backend:** FastAPI + Uvicorn