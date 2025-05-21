# Otaku-MN Admin Panel

## Overview

The AnimeTempo Admin Panel provides a comprehensive interface for administrators to manage the anime streaming platform. This document outlines the design, features, and implementation plan for the admin interface.

## Architecture

- **Framework**: React Native Expo (same as main app)
- **State Management**: Zustand
- **Styling**: NativeWind
- **Navigation**: Custom navigation system
- **Backend**: Supabase
- **Authentication**: Supabase Auth

## Core Screens

### 1. Home/Dashboard

The main dashboard for anime content management.

#### Features:
- **Anime Management**
  - Add new anime entries
  - Edit existing anime details
  - Delete anime entries
  - Batch operations
  - Add anime episode
  - edit anime episode
  - delete anime episode
  - able to change all kind of image
  
- **Episode Management**
  - Add episodes to anime
  - Edit episode details
  - Upload/link video content
  - Manage thumbnails
  
- **Notification System**
  - Create global notifications
  - Target notifications to specific users
  - Schedule notifications
  - Notification templates

- **Analytics Dashboard**
  - User engagement metrics
  - Popular anime tracking
  - Viewing statistics

### 2. Search

Advanced search functionality for administrators.

#### Features:
- **Enhanced Search**
  - Search by any field (title, genre, status)
  - Advanced filters
  - Bulk actions on search results
  
- **User Search**
  - Find users by username, email, or ID
  - View user activity
  - Access user management from search results

### 3. User Management

Comprehensive user administration tools.

#### Features:
- **User CRUD Operations**
  - Create new users
  - Edit user profiles
  - Delete user accounts
  - Reset passwords
  
- **Role Management**
  - Promote users to admin
  - Adjust user permissions
  - Manage access levels
  
- **User Activity**
  - View watch history
  - See favorites and lists
  - Monitor user engagement

## Database Schema Integration

The admin panel will interact with the following database tables:

1. **anime** - Manage anime entries
   - Fields: id, title, image_url, genres, rating, release_date, cover_image_url, etc.

2. **episodes** - Manage episodes for each anime
   - Fields: id, anime_id, title, description, episode_number, video_url, etc.

3. **users** - Manage user accounts
   - Fields: id, username, avatar_url, bio, role, level, xp

4. **notifications** - Create and manage notifications
   - Fields: id, user_id, type, content, read, created_at

5. **user_anime_lists** - View and manage user anime lists
   - Fields: id, user_id, anime_id, list_type, progress, rating, notes

6. **favorites** - View user favorites
   - Fields: id, user_id, anime_id

7. **anime_relations** - Manage relationships between anime
   - Fields: id, anime_id, related_anime_id, relation_type

## Implementation Plan

### Phase 1: Authentication & Basic Structure

1. Set up admin authentication with Supabase
2. Create the main navigation structure
3. Implement role-based access control
4. Design basic UI components for the admin panel

### Phase 2: Anime Management

1. Create anime listing interface
2. Implement anime CRUD operations
3. Build episode management system
4. Develop batch operations functionality

### Phase 3: User Management

1. Build user search and listing
2. Implement user profile editing
3. Create role management system
4. Develop user activity monitoring

### Phase 4: Notification System

1. Create notification creation interface
2. Implement targeting and scheduling
3. Build notification templates
4. Develop notification analytics

### Phase 5: Analytics & Reporting

1. Implement basic analytics dashboard
2. Create reporting functionality
3. Build export capabilities
4. Develop trend analysis tools

## Component Structure

Following the 500-line limit rule, the admin panel will be organized into these component directories:

```
app/
├── admin.tsx                      # Main admin entry point
├── adminDashboard.tsx             # Dashboard/Home screen
├── adminSearch.tsx                # Search screen
├── adminUsers.tsx                 # User listing
├── adminUserDetail.tsx            # User detail/edit
├── adminUserCreate.tsx            # Create new user
├── adminAnime.tsx                 # Anime listing
├── adminAnimeDetail.tsx           # Anime detail/edit
├── adminAnimeEpisodes.tsx         # Episode management
├── adminAnimeRelations.tsx        # Related anime management
├── adminAnimeCreate.tsx           # Create new anime
├── adminNotifications.tsx         # Notification listing
├── adminNotificationCreate.tsx    # Create notification
├── adminNotificationTemplates.tsx # Notification templates
├── components/
│   ├── Admin/
│   │   ├── AnimeForm.tsx          # Reusable anime form
│   │   ├── EpisodeForm.tsx        # Episode form component
│   │   ├── UserForm.tsx           # User form component
│   │   ├── NotificationForm.tsx   # Notification form
│   │   ├── AdminHeader.tsx        # Admin header with navigation
│   │   ├── AdminSidebar.tsx       # Admin sidebar navigation
│   │   ├── DataTable.tsx          # Reusable data table component
│   │   ├── FilterBar.tsx          # Filtering component
│   │   ├── ActionBar.tsx          # Bulk actions component
│   │   └── StatsCard.tsx          # Analytics card component
│   └── ...existing components
└── context/
    ├── AdminContext.tsx           # Admin-specific context
    └── ...existing contexts
```

## API Integration

The admin panel will use the following Supabase interactions:

1. **Authentication**
   ```typescript
   // Check if user is admin in AuthContext
   const { user } = useAuth();
   if (user?.role === 'admin') {
     // Allow admin access
   }
   ```

2. **Anime Management**
   ```typescript
   // Create anime
   const { data, error } = await supabase
     .from('anime')
     .insert([{ title, image_url, genres, rating, ... }])
     
   // Update anime
   const { data, error } = await supabase
     .from('anime')
     .update({ title, image_url, ... })
     .eq('id', animeId)
     
   // Delete anime
   const { data, error } = await supabase
     .from('anime')
     .delete()
     .eq('id', animeId)
   ```

3. **User Management**
   ```typescript
   // Update user role
   const { data, error } = await supabase
     .from('users')
     .update({ role: 'admin' })
     .eq('id', userId)
   ```

4. **Notifications**
   ```typescript
   // Create notification
   const { data, error } = await supabase
     .from('notifications')
     .insert([{ 
       user_id: targetUserId, // null for global
       type: notificationType,
       content: notificationContent
     }])
   ```

## Security Considerations

1. **Role-Based Access Control**
   - Verify admin role on client and server
   - Use RLS policies in Supabase

2. **Input Validation**
   - Validate all inputs before database operations
   - Sanitize content to prevent XSS

3. **Audit Logging**
   - Log all admin actions
   - Maintain history of changes

## UI/UX Design Guidelines

1. **Consistent Design Language**
   - Use the same design system as the main app
   - Maintain brand consistency

2. **Admin-Specific UI Elements**
   - Clear action buttons
   - Confirmation dialogs for destructive actions
   - Batch operation interfaces

3. **Responsive Design**
   - Optimize for both mobile and tablet/desktop views
   - Consider admin operations on larger screens

## Testing Strategy

1. **Unit Tests**
   - Test individual admin components
   - Validate form logic

2. **Integration Tests**
   - Test API interactions
   - Verify role-based access

3. **End-to-End Tests**
   - Test complete admin workflows
   - Verify security measures

## Navigation Implementation

The admin panel will use the existing custom navigation system with the following approach:

1. **AdminNavigation Component**: Utilize and extend the existing AdminNavigation component that provides both sidebar and bottom navigation variants

2. **Screen Switching**: Implement a screen manager in the admin entry point that conditionally renders the appropriate admin screen based on the selected navigation item

3. **Navigation State Management**: Use Zustand to manage the current admin screen and navigation state

4. **Deep Linking**: Support deep linking to specific admin sections through custom URL handling

## Deployment

The admin panel will be integrated into the main AnimeTempo app but will only be accessible to users with the 'admin' role. This approach ensures:

1. Single codebase maintenance
2. Consistent authentication
3. Shared components where appropriate
4. Role-based access control

## Future Enhancements

1. **Advanced Analytics**
   - User retention metrics
   - Content performance analysis

2. **Content Moderation**
   - Comment/review moderation tools
   - User-generated content management

3. **A/B Testing**
   - Feature testing framework
   - User experience optimization

4. **Automation**
   - Scheduled content updates
   - Automated notifications
   - Batch processing tools
