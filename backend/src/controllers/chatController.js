import Chat from '../models/Chat.js';
import ChatRequest from '../models/ChatRequest.js';
import Pet from '../models/Pet.js';
import User from '../models/User.js';

/**
 * Get all chats for the authenticated user
 * Only shows chats where user is a participant (for adoption or found pet claims)
 * GET /api/chats
 */
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all chats where the user is a participant
    const chats = await Chat.find({
      participants: userId,
      is_active: true,
    })
      .populate('pet_id', 'species breed color_primary report_type status')
      .populate('participants', 'name email role')
      .populate('messages.sender_id', 'name email')
      .sort({ updatedAt: -1 });

    // Transform to match frontend expectations
    const transformedChats = chats.map((chat) => ({
      roomId: chat.room_id,
      _id: chat._id,
      petId: chat.pet_id?._id || chat.pet_id,
      type: chat.pet_id?.report_type === 'found' ? 'claim' : 'adoption',
      participants: chat.participants?.map((p) => ({
        id: p._id || p,
        name: p.name || 'Unknown',
        email: p.email || '',
        role: p.role || 'user',
      })) || [],
      messages: chat.messages?.map((msg) => ({
        id: msg._id,
        sender: {
          id: msg.sender_id?._id || msg.sender_id,
          name: msg.sender_id?.name || 'Unknown',
        },
        text: msg.message,
        timestamp: msg.timestamp,
      })) || [],
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: transformedChats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user chats',
    });
  }
};

/**
 * Get chat requests for the authenticated user
 * Shows requests where user is the owner (pending approval) or requester
 * GET /api/chats/requests
 */
export const getChatRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get requests where user is the owner (needs to approve) or requester
    const requests = await ChatRequest.find({
      $or: [
        { owner_id: userId }, // User owns the pet - needs to approve
        { requester_id: userId }, // User requested - can see status
      ],
    })
      .populate('pet_id', 'species breed color_primary report_type')
      .populate('requester_id', 'name email')
      .populate('owner_id', 'name email')
      .sort({ createdAt: -1 });

    // Transform to match frontend expectations
    const transformedRequests = requests.map((req) => ({
      id: req._id,
      _id: req._id,
      petId: req.pet_id?._id || req.pet_id,
      requesterId: req.requester_id?._id || req.requester_id,
      ownerId: req.owner_id?._id || req.owner_id,
      type: req.type,
      message: req.message,
      status: req.status,
      roomId: req.room_id,
      createdAt: req.createdAt,
      respondedAt: req.responded_at,
      // Indicate if user is the owner (can approve) or requester
      isOwner: req.owner_id?._id?.toString() === userId || req.owner_id?.toString() === userId,
    }));

    res.status(200).json({
      success: true,
      data: transformedRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch chat requests',
    });
  }
};

/**
 * Get specific chat room details
 * GET /api/chats/:roomId
 */
export const getChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findOne({ room_id: roomId })
      .populate('pet_id', 'species breed color_primary report_type status')
      .populate('participants', 'name email role')
      .populate('messages.sender_id', 'name email');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
      (p) => (p._id || p).toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this chat',
      });
    }

    // Transform to match frontend expectations
    const transformedChat = {
      roomId: chat.room_id,
      _id: chat._id,
      petId: chat.pet_id?._id || chat.pet_id,
      type: chat.pet_id?.report_type === 'found' ? 'claim' : 'adoption',
      participants: chat.participants?.map((p) => ({
        id: p._id || p,
        name: p.name || 'Unknown',
        email: p.email || '',
        role: p.role || 'user',
      })) || [],
      messages: chat.messages?.map((msg) => ({
        id: msg._id,
        sender: {
          id: msg.sender_id?._id || msg.sender_id,
          name: msg.sender_id?.name || 'Unknown',
        },
        text: msg.message,
        timestamp: msg.timestamp,
      })) || [],
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: transformedChat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch chat room',
    });
  }
};

/**
 * Request a chat with pet owner/finder
 * POST /api/chats/request
 */
export const requestChat = async (req, res) => {
  try {
    const { petId, type, message } = req.body;

    // Validate required fields
    if (!petId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Pet ID and type are required',
      });
    }

    // Validate petId format
    if (!/^[0-9a-fA-F]{24}$/.test(petId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID format',
      });
    }

    // Validate type
    const allowedTypes = ['adoption', 'claim'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "adoption" or "claim"',
      });
    }

    // Validate and sanitize message
    let sanitizedMessage = null;
    if (message && typeof message === 'string') {
      if (message.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Message cannot exceed 500 characters',
        });
      }
      // Sanitize message (remove HTML/XSS)
      sanitizedMessage = message.trim().substring(0, 500);
    }
    
    const requesterId = req.user.id;

    // Get pet to find owner
    const pet = await Pet.findById(petId).populate('submitted_by', '_id');
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    const ownerId = pet.submitted_by?._id || pet.submitted_by;

    // Check if request already exists
    const existingRequest = await ChatRequest.findOne({
      pet_id: petId,
      requester_id: requesterId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this pet',
      });
    }

    // Create chat request
    const chatRequest = new ChatRequest({
      pet_id: petId,
      requester_id: requesterId,
      owner_id: ownerId,
      type: type, // 'claim' or 'adoption'
      message: sanitizedMessage || '',
      status: 'pending',
    });

    await chatRequest.save();

    // Populate for response
    await chatRequest.populate('pet_id', 'species breed color_primary');
    await chatRequest.populate('requester_id', 'name email');
    await chatRequest.populate('owner_id', 'name email');

    res.status(201).json({
      success: true,
      data: {
        id: chatRequest._id,
        _id: chatRequest._id,
        petId: chatRequest.pet_id?._id || chatRequest.pet_id,
        requesterId: chatRequest.requester_id?._id || chatRequest.requester_id,
        ownerId: chatRequest.owner_id?._id || chatRequest.owner_id,
        type: chatRequest.type,
        message: chatRequest.message,
        status: chatRequest.status,
        createdAt: chatRequest.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create chat request',
    });
  }
};

/**
 * Respond to chat request (approve/reject)
 * POST /api/chats/requests/:id/respond
 */
export const respondToChatRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    const userId = req.user.id;

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format',
      });
    }

    // Validate approved field
    if (typeof approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Approved field must be a boolean',
      });
    }

    const request = await ChatRequest.findById(id)
      .populate('pet_id', 'species breed report_type')
      .populate('requester_id', '_id name email')
      .populate('owner_id', '_id name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Chat request not found',
      });
    }

    // Verify user is the owner
    const ownerId = request.owner_id?._id || request.owner_id;
    if (ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the pet owner can respond to this request',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed',
      });
    }

    request.status = approved ? 'approved' : 'rejected';
    request.responded_at = new Date();
    await request.save();

    if (approved) {
      // Get admin user to add to chat (get first admin found)
      const adminUser = await User.findOne({ role: 'admin' }).select('_id');
      
      // Create chat room with admin included
      const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const participants = [
        request.requester_id?._id || request.requester_id,
        request.owner_id?._id || request.owner_id,
      ];
      
      // Add admin if exists (admin should always be in adoption/claim chats)
      if (adminUser && adminUser._id) {
        // Only add if not already in participants
        const adminIdStr = adminUser._id.toString();
        if (!participants.some(p => (p?._id || p).toString() === adminIdStr)) {
          participants.push(adminUser._id);
        }
      }

      const chat = new Chat({
        room_id: roomId,
        pet_id: request.pet_id?._id || request.pet_id,
        participants: participants,
        messages: [],
        is_active: true,
      });
      await chat.save();
      request.room_id = roomId;
      await request.save();
    }

    res.status(200).json({
      success: true,
      data: {
        id: request._id,
        status: request.status,
        roomId: request.room_id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to respond to chat request',
    });
  }
};

/**
 * Send a message in a chat room
 * POST /api/chats/:roomId/message
 */
export const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;

    // Validate roomId
    if (!roomId || typeof roomId !== 'string' || roomId.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID',
      });
    }

    // Validate and sanitize message text
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message text is required',
      });
    }

    if (text.length > 1000 || text.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Message must be between 1 and 1000 characters',
      });
    }
    
    // Sanitize message text (remove HTML/XSS)
    const sanitizedText = text.trim().substring(0, 1000);
    
    const userId = req.user.id;

    const chat = await Chat.findOne({ room_id: roomId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this chat',
      });
    }

    // Add message
    chat.messages.push({
      sender_id: userId,
      message: sanitizedText,
      timestamp: new Date(),
      is_read: false,
    });

    await chat.save();

    // Populate sender for response
    await chat.populate('messages.sender_id', 'name email');

    const lastMessage = chat.messages[chat.messages.length - 1];

    res.status(201).json({
      success: true,
      data: {
        id: lastMessage._id,
        sender: {
          id: lastMessage.sender_id?._id || lastMessage.sender_id,
          name: lastMessage.sender_id?.name || 'Unknown',
        },
        text: lastMessage.message,
        timestamp: lastMessage.timestamp,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message',
    });
  }
};

