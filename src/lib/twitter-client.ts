import { TwitterClientBase } from './twitter-client-base.js';
import { withMedia } from './twitter-client-media.js';
import { withPosting } from './twitter-client-posting.js';
import { withSearch } from './twitter-client-search.js';
import { withTimelines } from './twitter-client-timelines.js';
import { withTweetDetails } from './twitter-client-tweet-detail.js';
import { withUsers } from './twitter-client-users.js';

const MixedTwitterClient = withUsers(withTimelines(withSearch(withTweetDetails(withPosting(withMedia(TwitterClientBase))))));

export class TwitterClient extends MixedTwitterClient {}

export type {
  CurrentUserResult,
  FollowingResult,
  GetTweetResult,
  SearchResult,
  TweetData,
  TwitterClientOptions,
  TweetResult,
  TwitterUser,
  UploadMediaResult,
} from './twitter-client-types.js';
