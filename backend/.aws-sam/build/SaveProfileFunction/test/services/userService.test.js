const userService = require('../../services/userService');
const { DynamoDB } = require('aws-sdk');

// Mock DynamoDB
jest.mock('aws-sdk');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      // Given
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockQuery = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [mockUser]
        })
      });

      DynamoDB.DocumentClient.mockImplementation(() => ({
        query: mockQuery
      }));

      // When
      const result = await userService.findByEmail('test@example.com');

      // Then
      expect(result).toEqual(mockUser);
      expect(mockQuery).toHaveBeenCalledWith({
        TableName: 'date-sense-users',
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': 'test@example.com'
        }
      });
    });

    it('should return null when user not found', async () => {
      // Given
      const mockQuery = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: []
        })
      });

      DynamoDB.DocumentClient.mockImplementation(() => ({
        query: mockQuery
      }));

      // When
      const result = await userService.findByEmail('nonexistent@example.com');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      // Given
      const mockProfile = {
        userId: 'user_123',
        photos: ['photo1.jpg', 'photo2.jpg'],
        bio: 'Test bio'
      };

      const mockGet = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: mockProfile
        })
      });

      DynamoDB.DocumentClient.mockImplementation(() => ({
        get: mockGet
      }));

      // When
      const result = await userService.getProfile('user_123');

      // Then
      expect(result).toEqual(mockProfile);
      expect(mockGet).toHaveBeenCalledWith({
        TableName: 'date-sense-profiles',
        Key: { userId: 'user_123' }
      });
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Given
      const userData = {
        email: 'new@example.com',
        name: 'New User'
      };

      const mockPut = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      DynamoDB.DocumentClient.mockImplementation(() => ({
        put: mockPut
      }));

      // When
      const result = await userService.createUser(userData);

      // Then
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(result.id).toMatch(/^user_\d+_/);
      expect(mockPut).toHaveBeenCalled();
    });
  });
}); 