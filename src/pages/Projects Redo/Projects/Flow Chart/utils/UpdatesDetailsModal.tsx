import React, { useState, useMemo } from 'react';
import { Update, User } from '../../../../../types';
import { useAuth } from '../../../../../context/AuthContext';
import { useAppContext } from '../../../../../context/AppContext';

import Button from '../../../../../components/ui/Button';
import Textarea from '../../../../../components/ui/Textarea';
import Input from '../../../../../components/ui/Input';
import Select from '../../../../../components/ui/Select';
import UserAvatar from '../../../../../components/UserAvatar';
import { MessageSquare, ChevronDown, ChevronUp, EyeOff, AtSign, Check, X, AlertTriangle } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';

interface UpdatesDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'project' | 'task' | 'subtask';
  entityId: string;
  entityName: string;
}

interface EnhancedUpdateItemProps {
  update: Update;
  user: User;
  currentUserId: string;
  onMarkAsRead: (updateId: string) => void;
  onReply: (updateId: string) => void;
  isReplying: boolean;
  replyForm?: React.ReactNode;
}

interface RequestUpdateItemProps {
  update: Update;
  user: User;
  currentUserId: string;
  users: User[];
  onRespondToRequest: (requestId: string, response: string) => void;
  onReply: (updateId: string) => void;
  isReplying: boolean;
  replyForm?: React.ReactNode;
}

const EnhancedUpdateItem: React.FC<EnhancedUpdateItemProps> = ({ 
  update, 
  user, 
  currentUserId,
  onMarkAsRead,
  onReply,
  isReplying,
  replyForm
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongMessage = update.message.length > 150;
  const isReadByCurrentUser = update.isReadBy?.includes(currentUserId) || false;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ' at ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div 
      className={`p-4 border rounded-lg mb-3 ${isReplying ? 'shadow-md' : 'shadow-sm'}`}
      style={{
        backgroundColor: brandTheme.background.primary, // Always white for individual updates
        borderColor: isReplying ? brandTheme.border.brand : 
                    isReadByCurrentUser ? brandTheme.border.light : 
                    brandTheme.border.brand
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start">
          <UserAvatar user={user} size="sm" />
          <div className="ml-2">
            <div className="text-sm font-medium" style={{ color: brandTheme.text.primary }}>
              {user.firstName} {user.lastName}
            </div>
            <div className="text-xs" style={{ color: brandTheme.text.muted }}>
              {formatDate(update.createdAt)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isReadByCurrentUser ? (
            <>
              <div 
                className="rounded-full px-3 py-1 border"
                style={{
                  backgroundColor: brandTheme.status.infoLight,
                  borderColor: brandTheme.status.info,
                }}
              >
                <span className="text-xs font-medium" style={{ color: brandTheme.primary.navy }}>
                  Unread
                </span>
              </div>
              <button
                onClick={() => onMarkAsRead(update.id)}
                className="transition-colors"
                style={{ color: brandTheme.gray[400] }}
                onMouseEnter={(e) => e.currentTarget.style.color = brandTheme.gray[600]}
                onMouseLeave={(e) => e.currentTarget.style.color = brandTheme.gray[400]}
                title="Mark as read"
              >
                <Check size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => onMarkAsRead(update.id)}
              className="text-xs flex items-center transition-colors"
              style={{ color: brandTheme.text.muted }}
              onMouseEnter={(e) => e.currentTarget.style.color = brandTheme.text.secondary}
              onMouseLeave={(e) => e.currentTarget.style.color = brandTheme.text.muted}
              title="Mark as unread"
            >
              <EyeOff size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className="ml-8">
        <p 
          className={`text-sm whitespace-pre-line ${isLongMessage && !isExpanded ? 'line-clamp-3' : ''}`}
          style={{ color: brandTheme.text.secondary }}
        >
          {update.message}
        </p>
        {isLongMessage && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs mt-1 flex items-center transition-colors"
            style={{ color: brandTheme.status.info }}
            onMouseEnter={(e) => e.currentTarget.style.color = brandTheme.interactive.hover}
            onMouseLeave={(e) => e.currentTarget.style.color = brandTheme.status.info}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={14} className="mr-1" /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={14} className="mr-1" /> Show more
              </>
            )}
          </button>
        )}
        
        <div className="mt-2 flex items-center space-x-3">
          <button
            onClick={() => onReply(update.id)}
            className="text-xs flex items-center transition-colors"
            style={{ color: brandTheme.status.info }}
            onMouseEnter={(e) => e.currentTarget.style.color = brandTheme.interactive.hover}
            onMouseLeave={(e) => e.currentTarget.style.color = brandTheme.status.info}
          >
            <MessageSquare size={12} className="mr-1" /> Reply
          </button>
          
          {update.isReadBy && update.isReadBy.length > 0 && (
            <span className="text-xs" style={{ color: brandTheme.text.muted }}>
              Read by {update.isReadBy.length} user{update.isReadBy.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      
      {/* Reply form appears below this update when replying */}
      {isReplying && replyForm && (
        <div 
          className="mt-4 ml-8 p-4 rounded-lg shadow-sm border"
          style={{
            backgroundColor: brandTheme.background.primary,
            borderColor: brandTheme.border.brand
          }}
        >
          {replyForm}
        </div>
      )}
    </div>
  );
};

const RequestUpdateItem: React.FC<RequestUpdateItemProps> = ({
  update,
  user,
  currentUserId,
  users,
  onRespondToRequest,
  onReply,
  isReplying,
  replyForm
}) => {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState('');

  if (!update.isRequest) return null;

  const requestedUser = users.find(u => u.id === update.isRequest!.requestedUserId);
  const isRequestedUser = currentUserId === update.isRequest!.requestedUserId;
  const hasResponded = update.isRequest!.respondedAt;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    await onRespondToRequest(update.id, responseText.trim());
    setResponseText('');
    setShowResponseForm(false);
  };

  return (
    <div 
      className="p-4 border rounded-lg mb-3 shadow-sm"
      style={{
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.brand
      }}
    >
      {/* Request Header - Centered and Prominent */}
      <div className="text-center mb-4">
        <div 
          className="text-lg font-semibold mb-2 pb-1 inline-block"
          style={{ 
            color: brandTheme.text.primary,
            borderBottom: '2px solid #ef4444'
          }}
        >
          <span>{user.firstName} {user.lastName}</span>
          <span style={{ color: brandTheme.text.muted }}> is requesting an update from </span>
          <span>{requestedUser?.firstName} {requestedUser?.lastName}</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <UserAvatar user={user} size="sm" />
          <div className="text-xs" style={{ color: brandTheme.text.muted }}>
            {formatDate(update.createdAt)}
          </div>
        </div>
      </div>

      {/* Request Content */}
      <div className="space-y-3">
        {/* Notes */}
        {update.isRequest.notes && (
          <div>
            <div className="text-sm font-medium mb-1" style={{ color: brandTheme.text.primary }}>
              Notes:
            </div>
            <div className="text-sm" style={{ color: brandTheme.text.secondary }}>
              {update.isRequest.notes}
            </div>
          </div>
        )}

        {/* Deadline */}
        {update.isRequest.deadline && (
          <div className="text-sm" style={{ color: brandTheme.text.secondary }}>
            <span className="font-medium">Deadline to respond: </span>
            {formatDate(update.isRequest.deadline)}
          </div>
        )}

        {/* Response Status */}
        {hasResponded && (
          <div className="text-sm" style={{ color: brandTheme.status.success }}>
            ✓ Response provided on {formatDate(update.isRequest.respondedAt!)}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-2">
          {/* Respond Button - only show if user is the requested user and hasn't responded */}
          {isRequestedUser && !hasResponded && (
            <button
              onClick={() => setShowResponseForm(!showResponseForm)}
              className="px-3 py-1 text-sm rounded transition-colors"
              style={{
                backgroundColor: brandTheme.status.success,
                color: 'white'
              }}
            >
              Respond to Request
            </button>
          )}

          {/* Comment on Request */}
          <button
            onClick={() => onReply(update.id)}
            className="text-xs flex items-center transition-colors"
            style={{ color: brandTheme.status.info }}
            onMouseEnter={(e) => e.currentTarget.style.color = brandTheme.interactive.hover}
            onMouseLeave={(e) => e.currentTarget.style.color = brandTheme.status.info}
          >
            <MessageSquare size={12} className="mr-1" /> Comment on Request
          </button>
        </div>

        {/* Response Form */}
        {showResponseForm && (
          <div 
            className="mt-4 p-4 rounded-lg border"
            style={{
              backgroundColor: brandTheme.background.secondary,
              borderColor: brandTheme.border.light
            }}
          >
            <form onSubmit={handleResponseSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.primary }}>
                  Your Response:
                </label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Provide your update response..."
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowResponseForm(false)}
                  className="text-sm underline transition-colors"
                  style={{ color: brandTheme.text.muted }}
                  onMouseEnter={(e) => e.currentTarget.style.color = brandTheme.text.secondary}
                  onMouseLeave={(e) => e.currentTarget.style.color = brandTheme.text.muted}
                >
                  Cancel
                </button>
                <Button type="submit" disabled={!responseText.trim()}>
                  Submit Response
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Reply form appears below when replying to request */}
        {isReplying && replyForm && (
          <div 
            className="mt-4 p-4 rounded-lg shadow-sm border"
            style={{
              backgroundColor: brandTheme.background.primary,
              borderColor: brandTheme.border.brand
            }}
          >
            {replyForm}
          </div>
        )}
      </div>
    </div>
  );
};

const UpdatesDetailsModal: React.FC<UpdatesDetailsModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
}) => {
  const { currentUser } = useAuth();
  const { getUpdatesForEntity, addUpdate, markUpdateAsRead, updateRequestStatus, getUsers } = useAppContext();
  const [newMessage, setNewMessage] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<User[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isMainFormFocused, setIsMainFormFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [unreadSortOrder, setUnreadSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [readSortOrder, setReadSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [requestUserId, setRequestUserId] = useState('');
  const [requestDeadline, setRequestDeadline] = useState('');
  const [requestNotes, setRequestNotes] = useState('');

  const users = getUsers();
  const updates = getUpdatesForEntity(entityType, entityId);



  // Separate request updates, unread updates, and read updates with sorting
  const { requestUpdates, unreadUpdates, readUpdates } = useMemo(() => {
    if (!currentUser) return { requestUpdates: [], unreadUpdates: [], readUpdates: [] };

    // Separate requests from regular updates
    // Only show requests that haven't been responded to yet
    const requests = updates.filter(update => update.isRequest && !update.isRequest.respondedAt);
    const regularUpdates = updates.filter(update => !update.isRequest || update.isRequest.respondedAt);

    const unread = regularUpdates.filter(update => !update.isReadBy?.includes(currentUser.id));
    const read = regularUpdates.filter(update => update.isReadBy?.includes(currentUser.id));

    // Sort request updates (newest first by default)
    const sortedRequests = requests.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Always newest first for requests
    });

    // Sort unread updates
    const sortedUnread = unread.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return unreadSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Sort read updates
    const sortedRead = read.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return readSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return { requestUpdates: sortedRequests, unreadUpdates: sortedUnread, readUpdates: sortedRead };
  }, [updates, currentUser, unreadSortOrder, readSortOrder]);

  const requestCount = requestUpdates.length;
  const unreadCount = unreadUpdates.length;
  const readCount = readUpdates.length;

  // Handle @ mentions
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNewMessage(value);
    setCursorPosition(cursorPos);

    // Check for @ mentions
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const searchTerm = textBeforeCursor.substring(lastAtIndex + 1);
      if (searchTerm.length >= 0 && !searchTerm.includes(' ')) {
        const filtered = users.filter(user => 
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5);
        
        setUserSuggestions(filtered);
        setShowUserSuggestions(true);
      } else {
        setShowUserSuggestions(false);
      }
    } else {
      setShowUserSuggestions(false);
    }
  };

  const handleUserSelect = (user: User) => {
    const textBeforeCursor = newMessage.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = newMessage.substring(cursorPosition);
    
    const newText = newMessage.substring(0, lastAtIndex + 1) + `${user.firstName} ${user.lastName} ` + textAfterCursor;
    setNewMessage(newText);
    setShowUserSuggestions(false);
    
    // Add to tagged users if not already tagged
    if (!taggedUsers.find(u => u.id === user.id)) {
      setTaggedUsers(prev => [...prev, user]);
    }
  };

  const handleMarkAsRead = async (updateId: string) => {
    if (!currentUser) return;
    
    try {
      await markUpdateAsRead(updateId, currentUser.id);
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  };

  const handleReply = (updateId: string) => {
    setReplyToId(replyToId === updateId ? null : updateId); // Toggle reply mode
    setNewMessage(''); // Clear any existing message
    setTaggedUsers([]); // Clear tagged users
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser) return;

    try {
      await addUpdate({
        message: newMessage.trim(),
        userId: currentUser.id,
        entityType,
        entityId,
        commentTo: replyToId || undefined,
        taggedUserIds: taggedUsers.map(u => u.id),
      });
      
      setNewMessage('');
      setReplyToId(null);
      setTaggedUsers([]);
    } catch (error) {
      console.error('Error adding update:', error);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestUserId || !currentUser) return;

    try {
      const requestedUser = users.find(u => u.id === requestUserId);
      if (!requestedUser) return;

      await addUpdate({
        message: `Update requested from ${requestedUser.firstName} ${requestedUser.lastName}${requestDeadline ? ` by ${new Date(requestDeadline).toLocaleDateString()}` : ''}${requestNotes ? `\n\nNotes: ${requestNotes}` : ''}`,
        userId: currentUser.id,
        entityType,
        entityId,
        isRequest: {
          requestedUserId: requestUserId,
          deadline: requestDeadline || undefined,
          notes: requestNotes || undefined,
        },
      });
      
      // Reset form and close popup
      setRequestUserId('');
      setRequestDeadline('');
      setRequestNotes('');
      setShowRequestPopup(false);
    } catch (error) {
      console.error('Error requesting update:', error);
    }
  };

  const handleRespondToRequest = async (requestId: string, response: string) => {
    if (!currentUser) return;

    try {
      // Create the response update
      const responseUpdateId = await addUpdate({
        message: response,
        userId: currentUser.id,
        entityType,
        entityId,
        commentTo: requestId,
        isReadBy: [currentUser.id], // Mark as read by the responder
      });

      // Update the original request to mark it as responded
      await updateRequestStatus(requestId, responseUpdateId);
    } catch (error) {
      console.error('Error responding to request:', error);
    }
  };

  // Create the reply form component
  const createReplyForm = (isMainForm: boolean = false) => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Textarea
          value={newMessage}
          onChange={handleTextareaChange}
          onFocus={() => isMainForm && setIsMainFormFocused(true)}
          onBlur={() => isMainForm && setIsMainFormFocused(false)}
          placeholder={isMainForm ? "Add an update... Use @ to mention users" : "Write your reply... Use @ to mention users"}
          rows={isMainForm && !isMainFormFocused && !newMessage ? 1 : 3}
        />
        
        {/* User suggestions dropdown */}
        {showUserSuggestions && userSuggestions.length > 0 && (
          <div 
            className="absolute z-10 w-full mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto border"
            style={{ 
              backgroundColor: brandTheme.background.primary,
              borderColor: brandTheme.border.medium
            }}
          >
            {userSuggestions.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleUserSelect(user)}
                className="w-full px-3 py-2 text-left flex items-center space-x-2 transition-colors"
                style={{ backgroundColor: brandTheme.background.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.secondary}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.primary}
              >
                <UserAvatar user={user} size="sm" />
                <span className="text-sm" style={{ color: brandTheme.text.primary }}>
                  {user.firstName} {user.lastName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Tagged users */}
      {taggedUsers.length > 0 && (
        <div className="flex items-center space-x-2">
          <AtSign size={14} style={{ color: brandTheme.text.muted }} />
          <div className="flex flex-wrap gap-1">
            {taggedUsers.map(user => (
              <span
                key={user.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                style={{ 
                  backgroundColor: brandTheme.status.infoLight,
                  color: brandTheme.primary.navy
                }}
              >
                {user.firstName} {user.lastName}
                <button
                  type="button"
                  onClick={() => setTaggedUsers(prev => prev.filter(u => u.id !== user.id))}
                  className="ml-1 transition-colors"
                  style={{ color: brandTheme.status.info }}
                  onMouseEnter={(e) => e.currentTarget.style.color = brandTheme.interactive.hover}
                  onMouseLeave={(e) => e.currentTarget.style.color = brandTheme.status.info}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        {!isMainForm && (
          <button
            type="button"
            onClick={() => setReplyToId(null)}
            className="text-sm underline transition-colors"
            style={{ color: brandTheme.text.muted }}
            onMouseEnter={(e) => e.currentTarget.style.color = brandTheme.text.secondary}
            onMouseLeave={(e) => e.currentTarget.style.color = brandTheme.text.muted}
          >
            Cancel reply
          </button>
        )}
        <div className={!isMainForm ? "" : "ml-auto"}>
          <Button type="submit" disabled={!newMessage.trim()}>
            {isMainForm ? "Add Update" : "Reply"}
          </Button>
        </div>
      </div>
    </form>
  );

  const modalTitle = `Updates for ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}: ${entityName}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" style={{ display: isOpen ? 'flex' : 'none' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">{modalTitle}</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowRequestPopup(true)}
              className="text-sm transition-colors underline"
              style={{ color: brandTheme.status.info }}
              onMouseEnter={(e) => e.currentTarget.style.color = brandTheme.interactive.hover}
              onMouseLeave={(e) => e.currentTarget.style.color = brandTheme.status.info}
            >
              Request an Update
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-blue-50 transition-colors"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>
        </div>
        
        {/* Modal Content */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6"
          style={{ backgroundColor: brandTheme.background.brandLight }}
        >
          {/* New Update Form - only show if not replying to a specific update */}
          {!replyToId && (
            <div 
              className="p-4 rounded-lg border"
              style={{ 
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.brand
              }}
            >
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Textarea
                    value={newMessage}
                    onChange={handleTextareaChange}
                    onFocus={() => {
                      setIsMainFormFocused(true);
                      setHasInteracted(true);
                    }}
                    onBlur={() => {
                      // Small delay to prevent flickering
                      setTimeout(() => setIsMainFormFocused(false), 100);
                    }}
                    placeholder="Add an update... Use @ to mention users"
                    rows={(!hasInteracted || (!isMainFormFocused && !newMessage)) ? 1 : 3}
                  />
                  
                  {/* User suggestions dropdown */}
                  {showUserSuggestions && userSuggestions.length > 0 && (
                    <div 
                      className="absolute z-10 w-full mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto border"
                      style={{ 
                        backgroundColor: brandTheme.background.primary,
                        borderColor: brandTheme.border.medium
                      }}
                    >
                      {userSuggestions.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full px-3 py-2 text-left flex items-center space-x-2 transition-colors"
                          style={{ backgroundColor: brandTheme.background.primary }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.secondary}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.primary}
                        >
                          <UserAvatar user={user} size="sm" />
                          <span className="text-sm" style={{ color: brandTheme.text.primary }}>
                            {user.firstName} {user.lastName}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Tagged users */}
                {taggedUsers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <AtSign size={14} style={{ color: brandTheme.text.muted }} />
                    <div className="flex flex-wrap gap-1">
                      {taggedUsers.map(user => (
                        <span
                          key={user.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                          style={{ 
                            backgroundColor: brandTheme.status.infoLight,
                            color: brandTheme.primary.navy
                          }}
                        >
                          {user.firstName} {user.lastName}
                          <button
                            type="button"
                            onClick={() => setTaggedUsers(prev => prev.filter(u => u.id !== user.id))}
                            className="ml-1 transition-colors"
                            style={{ color: brandTheme.status.info }}
                            onMouseEnter={(e) => e.currentTarget.style.color = brandTheme.interactive.hover}
                            onMouseLeave={(e) => e.currentTarget.style.color = brandTheme.status.info}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="ml-auto">
                  <Button type="submit" disabled={!newMessage.trim()}>
                    Add Update
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Request Updates Section */}
          {requestUpdates.length > 0 && (
            <div 
              className="border rounded-lg"
              style={{ 
                backgroundColor: brandTheme.background.brandLight,
                borderColor: brandTheme.border.brand
              }}
            >
              <div 
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: brandTheme.border.light }}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                    <h3 className="text-lg font-semibold" style={{ color: brandTheme.primary.navy }}>
                      Requested Updates
                    </h3>
                  </div>
                  <span 
                    className="px-2 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: brandTheme.status.infoLight,
                      color: brandTheme.primary.navy
                    }}
                  >
                    {requestCount}
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {requestUpdates.map(update => {
                  const user = users.find(u => u.id === update.userId);
                  if (!user || !currentUser) return null;
                  
                  return (
                    <RequestUpdateItem
                      key={update.id}
                      update={update}
                      user={user}
                      currentUserId={currentUser.id}
                      users={users}
                      onRespondToRequest={handleRespondToRequest}
                      onReply={handleReply}
                      isReplying={replyToId === update.id}
                      replyForm={replyToId === update.id ? createReplyForm(false) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Unread Updates Section */}
          {unreadUpdates.length > 0 && (
            <div 
              className="border rounded-lg"
              style={{ 
                backgroundColor: brandTheme.background.brandLight,
                borderColor: brandTheme.border.brand
              }}
            >
              <div 
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: brandTheme.border.light }}
              >
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold" style={{ color: brandTheme.primary.navy }}>
                    Unread Updates
                  </h3>
                  <span 
                    className="px-2 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: brandTheme.status.infoLight,
                      color: brandTheme.primary.navy
                    }}
                  >
                    {unreadCount}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setUnreadSortOrder(unreadSortOrder === 'newest' ? 'oldest' : 'newest')}
                    className="text-sm px-3 py-1 rounded border transition-colors"
                    style={{ 
                      borderColor: brandTheme.border.medium,
                      color: brandTheme.text.secondary
                    }}
                  >
                    {unreadSortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                  </button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      unreadUpdates.forEach(update => handleMarkAsRead(update.id));
                    }}
                  >
                    Mark all as read
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {unreadUpdates.map(update => {
                  const user = users.find(u => u.id === update.userId);
                  if (!user || !currentUser) return null;
                  
                  return (
                    <EnhancedUpdateItem
                      key={update.id}
                      update={update}
                      user={user}
                      currentUserId={currentUser.id}
                      onMarkAsRead={handleMarkAsRead}
                      onReply={handleReply}
                      isReplying={replyToId === update.id}
                      replyForm={replyToId === update.id ? createReplyForm(false) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Read Updates Section */}
          {readUpdates.length > 0 && (
            <div 
              className="border rounded-lg"
              style={{ 
                backgroundColor: brandTheme.background.brandLight,
                borderColor: brandTheme.border.light
              }}
            >
              <div 
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: brandTheme.border.light }}
              >
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold" style={{ color: brandTheme.text.primary }}>
                    Read Updates
                  </h3>
                  <span 
                    className="px-2 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: brandTheme.background.secondary,
                      color: brandTheme.text.secondary
                    }}
                  >
                    {readCount}
                  </span>
                </div>
                
                <button
                  onClick={() => setReadSortOrder(readSortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="text-sm px-3 py-1 rounded border transition-colors"
                  style={{ 
                    borderColor: brandTheme.border.medium,
                    color: brandTheme.text.secondary
                  }}
                >
                  {readSortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                </button>
              </div>
              
              <div className="p-4 space-y-3">
                {readUpdates.map(update => {
                  const user = users.find(u => u.id === update.userId);
                  if (!user || !currentUser) return null;
                  
                  return (
                    <EnhancedUpdateItem
                      key={update.id}
                      update={update}
                      user={user}
                      currentUserId={currentUser.id}
                      onMarkAsRead={handleMarkAsRead}
                      onReply={handleReply}
                      isReplying={replyToId === update.id}
                      replyForm={replyToId === update.id ? createReplyForm(false) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {requestUpdates.length === 0 && unreadUpdates.length === 0 && readUpdates.length === 0 && (
            <div className="py-12 text-center" style={{ color: brandTheme.text.muted }}>
              <MessageSquare size={32} className="mx-auto mb-3" style={{ color: brandTheme.gray[400] }} />
              <p className="text-lg">No updates yet for this {entityType}</p>
              <p className="text-sm mt-1">Be the first to add an update!</p>
            </div>
          )}
        </div>
      </div>

      {/* Request Update Popup */}
      {showRequestPopup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Popup Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold" style={{ color: brandTheme.text.primary }}>
                Request an Update
              </h3>
              <button
                onClick={() => setShowRequestPopup(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: brandTheme.text.muted }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-6">
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.primary }}>
                    Request update from:
                  </label>
                  <Select
                    value={requestUserId}
                    onChange={(value) => setRequestUserId(value)}
                    options={[
                      { value: '', label: 'Select a user...' },
                      ...users.map(user => ({
                        value: user.id,
                        label: `${user.firstName} ${user.lastName}`
                      }))
                    ]}
                    required
                  />
                </div>

                {/* Deadline (Optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.primary }}>
                    Deadline (optional):
                  </label>
                  <Input
                    type="date"
                    value={requestDeadline}
                    onChange={(e) => setRequestDeadline(e.target.value)}
                  />
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.primary }}>
                    Notes (optional):
                  </label>
                  <Textarea
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="Any additional notes or context..."
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRequestPopup(false)}
                    className="px-4 py-2 text-sm rounded transition-colors"
                    style={{ 
                      color: brandTheme.text.muted,
                      borderColor: brandTheme.border.medium 
                    }}
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={!requestUserId}>
                    Send Request
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdatesDetailsModal;
