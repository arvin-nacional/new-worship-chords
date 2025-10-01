/**
 * @jest-environment node
 */

import { POST } from '../route'
import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

jest.mock('@/lib/mongoose')
jest.mock('@/models/User')

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new user successfully', async () => {
    const mockUser = {
      _id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      isAdmin: false,
    }

    ;(dbConnect as jest.Mock).mockResolvedValue({})
    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(User.create as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe('User created successfully')
    expect(data.user.email).toBe('john@example.com')
  })

  it('should return error if user already exists', async () => {
    ;(dbConnect as jest.Mock).mockResolvedValue({})
    ;(User.findOne as jest.Mock).mockResolvedValue({ email: 'john@example.com' })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('User with this email already exists')
  })

  it('should return validation error for invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  it('should return validation error for short password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })
    // === EDGE CASE TESTS ===

  // Empty string validations
  it('should return validation error for empty name', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: '',
        email: 'john@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  it('should return validation error for empty email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: '',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  // Missing fields
  it('should return validation error for missing name', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'john@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  it('should return validation error for missing password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  // Boundary testing - Name
  it('should return validation error for name with only 1 character', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'J',
        email: 'john@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  it('should accept name with exactly 2 characters (boundary)', async () => {
    const mockUser = {
      _id: '123',
      name: 'Jo',
      email: 'jo@example.com',
      isAdmin: false,
    }

    ;(dbConnect as jest.Mock).mockResolvedValue({})
    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(User.create as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Jo',
        email: 'jo@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user.name).toBe('Jo')
  })

  // Boundary testing - Password
  it('should return validation error for password with exactly 5 characters (boundary)', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: '12345',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  it('should accept password with exactly 6 characters (boundary)', async () => {
    const mockUser = {
      _id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      isAdmin: false,
    }

    ;(dbConnect as jest.Mock).mockResolvedValue({})
    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(User.create as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
  })

  // Special characters
  it('should accept name with special characters and accents', async () => {
    const mockUser = {
      _id: '123',
      name: "José O'Connor-Smith",
      email: 'jose@example.com',
      isAdmin: false,
    }

    ;(dbConnect as jest.Mock).mockResolvedValue({})
    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(User.create as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: "José O'Connor-Smith",
        email: 'jose@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user.name).toBe("José O'Connor-Smith")
  })

  // Invalid email formats
  it('should return validation error for email without @ symbol', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'johnexample.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  it('should return validation error for email without domain', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
  })

  // Database error handling
  it('should handle database connection error', async () => {
    ;(dbConnect as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should handle MongoDB duplicate key error (11000)', async () => {
    ;(dbConnect as jest.Mock).mockResolvedValue({})
    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(User.create as jest.Mock).mockRejectedValue({ code: 11000 })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('User with this email already exists')
  })

  it('should handle unexpected database errors', async () => {
    ;(dbConnect as jest.Mock).mockResolvedValue({})
    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(User.create as jest.Mock).mockRejectedValue(new Error('Unexpected error'))

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  // Email case sensitivity
  it('should handle email with mixed case', async () => {
    const mockUser = {
      _id: '123',
      name: 'John Doe',
      email: 'John.Doe@Example.COM',
      isAdmin: false,
    }

    ;(dbConnect as jest.Mock).mockResolvedValue({})
    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(User.create as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'John.Doe@Example.COM',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user.email).toBe('John.Doe@Example.COM')
  })

  // Data integrity checks
  it('should verify User.create is called with correct data', async () => {
    const mockUser = {
      _id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      isAdmin: false,
    }

    ;(dbConnect as jest.Mock).mockResolvedValue({})
    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(User.create as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }),
    })

    await POST(request)

    expect(User.create).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })
  })

  it('should verify dbConnect is called', async () => {
    const mockUser = {
      _id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      isAdmin: false,
    }

    ;(dbConnect as jest.Mock).mockResolvedValue({})
    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(User.create as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }),
    })

    await POST(request)

    expect(dbConnect).toHaveBeenCalled()
  })
})