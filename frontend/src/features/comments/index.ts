/**
 * Feature: Comments & Discussion Thread
 * Master Barrel Export — Public API for feature 'comments'
 */

// Types
export * from './types';

// Services
export {
  subscribeToComments,
  addComment,
  DEV_SAMPLE_COMMENTS,
} from './services/commentService';

// Hooks
export { useComments } from './hooks/useComments';
export type { UseCommentsProps, UseCommentsReturn } from './hooks/useComments';

// Components
export { CommentItem } from './components/CommentItem';
export type { CommentItemProps } from './components/CommentItem';
export { CommentInput } from './components/CommentInput';
export type { CommentInputProps } from './components/CommentInput';
export { CommentThread } from './components/CommentThread';
export type { CommentThreadProps } from './components/CommentThread';
