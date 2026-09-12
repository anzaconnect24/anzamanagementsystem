"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FaBookmark,
  FaChartBar,
  FaImage,
  FaPaperPlane,
  FaRegBookmark,
  FaRegComment,
  FaRegThumbsUp,
  FaRetweet,
  FaSearch,
  FaThumbsDown,
  FaThumbsUp,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  createFeedComment,
  createFeedPost,
  getFeed,
  getFeedComments,
  getFeedMembers,
  reactToFeedPost,
  removeFeedComment,
  removeFeedPost,
  repostFeedPost,
  saveFeedPost,
} from "@/controllers/feed_controller";
import { server_url } from "@/utils/endpoint";

const AVATAR = "/images/default-avatar.png";

// What the platform calls each kind of person, rather than the code's own
// spelling of it.
const ROLE_LABEL = {
  Enterprenuer: "Startup",
  BDA: "Business Development Advisor",
  ME: "Monitoring & Evaluation Officer",
  Finance: "Finance Officer",
  Mentor: "Mentor",
  Investor: "Investor",
  Admin: "Administrator",
};

const label = (role) => ROLE_LABEL[role] || role || "Member";

const firstName = (name) => String(name || "there").trim().split(/\s+/)[0];

// A feed is read in "how long ago", not in dates — until it is old enough
// that the date is the more useful answer.
const when = (value) => {
  if (!value) return "";

  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return "";

  const seconds = Math.round((Date.now() - then.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return then.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// The reactions a reader can leave without writing a comment. They all live
// behind the one button: a tap leaves the first of them, holding it opens
// the rest. Order here is the order they are offered in.
const REACTIONS = {
  like: { label: "Like", glyph: "👍", ink: "text-[#082d77]" },
  dislike: { label: "Dislike", glyph: "👎", ink: "text-rose-600" },
  love: { label: "Love", glyph: "❤️", ink: "text-rose-500" },
  celebrate: { label: "Celebrate", glyph: "🎉", ink: "text-amber-500" },
  insightful: { label: "Insightful", glyph: "💡", ink: "text-violet-600" },
};

const Avatar = ({ person, size = "h-10 w-10" }) => (
  <img
    src={person?.image || AVATAR}
    alt={person?.name || "Member"}
    onError={(event) => {
      event.currentTarget.src = AVATAR;
    }}
    className={`${size} shrink-0 rounded-full border-2 border-white object-cover`}
  />
);

// The platform's live feed: one board everybody signed in shares, newest
// first. A startup, a mentor, an investor and the programme team all post
// into the same place and reply to each other.
const LiveFeed = () => {
  const { userDetails } = useContext(UserContext) || {};

  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ count: 0, hasMore: false });
  const [members, setMembers] = useState({
    members: 0,
    recent: [],
    mostActive: [],
  });

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("latest");

  // The composer stays a single line until it is clicked into.
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [posting, setPosting] = useState(false);

  // Which posts have their conversation open, and what is half-typed under
  // each of them.
  const [expanded, setExpanded] = useState({});
  const [threads, setThreads] = useState({});
  const [replies, setReplies] = useState({});
  const [replying, setReplying] = useState(null);
  const [confirming, setConfirming] = useState(null);

  // Which post has its reaction picker open, if any. One button carries all
  // the reactions: a tap likes, and hovering or holding it opens the rest.
  const [picker, setPicker] = useState(null);
  const pickerTimer = useRef(null);

  const openPicker = (uuid, delay = 350) => {
    clearTimeout(pickerTimer.current);
    pickerTimer.current = setTimeout(() => setPicker(uuid), delay);
  };

  // Leaving closes it, but not instantly — the pointer has to cross the gap
  // between the button and the row of faces above it.
  const closePicker = () => {
    clearTimeout(pickerTimer.current);
    pickerTimer.current = setTimeout(() => setPicker(null), 250);
  };

  const cancelPicker = () => clearTimeout(pickerTimer.current);

  const closePickerNow = () => {
    clearTimeout(pickerTimer.current);
    setPicker(null);
  };

  useEffect(() => () => clearTimeout(pickerTimer.current), []);

  // Posts written since this page was painted, held back rather than shoved
  // in under the reader's cursor.
  const [waiting, setWaiting] = useState(0);
  const newest = useRef(null);

  const read = (params) => getFeed({ limit: 20, ...params });

  const load = (params = {}) =>
    read({
      keyword: keyword.trim() || undefined,
      // "Saved" is a narrowing the server does, not a sort the page can fake.
      saved: sort === "saved" ? 1 : undefined,
      ...params,
    })
      .then((body) => {
        setPosts(body.data || []);
        setMeta({ count: body.count || 0, hasMore: !!body.hasMore });
        newest.current = body.data?.[0]?.uuid || null;
        setWaiting(0);
      })
      .catch(() => toast.error("Failed to load the feed"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    getFeedMembers().then(setMembers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Searching re-reads the feed rather than filtering what is already here,
  // so a match further back than this page is still found.
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      load();
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // Switching to or from Saved changes which posts the server sends, so it
  // re-reads rather than reordering what is already here.
  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // The feed keeps itself current, but never moves the page while it is
  // being read: new posts are counted, and go in when the reader asks.
  useEffect(() => {
    const timer = setInterval(() => {
      read({ limit: 5 })
        .then((body) => {
          const top = body.data || [];
          if (!newest.current) return;

          const seen = top.findIndex((post) => post.uuid === newest.current);
          setWaiting(seen === -1 ? top.length : seen);
        })
        .catch(() => {});
    }, 45000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    if (sort !== "discussed") return posts;
    return [...posts].sort((a, b) => b.commentCount - a.commentCount);
  }, [posts, sort]);

  const onPickImage = (file) => {
    setImage(file || null);
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  const resetComposer = () => {
    setDraft({ title: "", body: "" });
    onPickImage(null);
    setOpen(false);
  };

  const onPost = async (event) => {
    event.preventDefault();

    if (!draft.body.trim()) {
      toast.error("Write something to post");
      return;
    }

    const form = new FormData();
    form.append("body", draft.body.trim());
    if (draft.title.trim()) form.append("title", draft.title.trim());
    if (image) form.append("image", image);

    setPosting(true);
    const response = await createFeedPost(form);
    setPosting(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to post");
      return;
    }

    const post = response.body || response;

    // Straight to the top, where it would have landed on a reload anyway.
    setPosts((prev) => [post, ...prev]);
    setMeta((prev) => ({ ...prev, count: prev.count + 1 }));
    newest.current = post.uuid;
    resetComposer();
    toast.success("Posted");
  };

  const onLoadMore = async () => {
    setLoadingMore(true);

    try {
      const body = await read({
        offset: posts.length,
        keyword: keyword.trim() || undefined,
      });
      setPosts((prev) => [...prev, ...(body.data || [])]);
      setMeta({ count: body.count || 0, hasMore: !!body.hasMore });
    } catch {
      toast.error("Failed to load more");
    }

    setLoadingMore(false);
  };

  const toggleThread = async (post) => {
    const isOpen = !!expanded[post.uuid];
    setExpanded((prev) => ({ ...prev, [post.uuid]: !isOpen }));

    // The feed ships the newest few comments with each post; opening the
    // thread is what asks for the rest.
    if (!isOpen && !threads[post.uuid]) {
      try {
        const body = await getFeedComments(post.uuid);
        setThreads((prev) => ({ ...prev, [post.uuid]: body.data || [] }));
      } catch {
        toast.error("Failed to load the comments");
      }
    }
  };

  const onReply = async (post) => {
    const body = (replies[post.uuid] || "").trim();

    if (!body) return;

    setReplying(post.uuid);
    const response = await createFeedComment(post.uuid, body);
    setReplying(null);

    if (response?.status === false) {
      toast.error(response.message || "Failed to reply");
      return;
    }

    const comment = response.body || response;

    setThreads((prev) => ({
      ...prev,
      [post.uuid]: [...(prev[post.uuid] || post.comments || []), comment],
    }));

    setPosts((prev) =>
      prev.map((row) =>
        row.uuid !== post.uuid
          ? row
          : {
              ...row,
              commentCount: row.commentCount + 1,
              comments: [...row.comments, comment].slice(-3),
              commenters: row.commenters.some(
                (person) => person.uuid === comment.author?.uuid,
              )
                ? row.commenters
                : [...row.commenters, comment.author],
            },
      ),
    );

    setReplies((prev) => ({ ...prev, [post.uuid]: "" }));

    // Replying to a closed post opens it: a reply you cannot see afterwards
    // reads as one that did not send. The full thread is fetched at the same
    // time, since the feed only ships the newest few with each post.
    if (!expanded[post.uuid]) {
      setExpanded((prev) => ({ ...prev, [post.uuid]: true }));

      try {
        const all = await getFeedComments(post.uuid);
        setThreads((prev) => ({ ...prev, [post.uuid]: all.data || [] }));
      } catch {
        // The reply is already on screen; the rest of the thread can wait.
      }
    }
  };

  // Like or dislike. The button lights straight away and the server's
  // recount replaces the guess a moment later — a reaction that waits on a
  // round trip feels broken, and a guess that is never corrected drifts.
  const onReact = async (post, kind) => {
    closePickerNow();

    // Tapping the reaction you already left takes it back.
    const next = post.myReaction === kind ? null : kind;

    const counts = { ...(post.reactions || {}) };

    if (post.myReaction) {
      counts[post.myReaction] = Math.max(
        (counts[post.myReaction] || 1) - 1,
        0,
      );
      if (!counts[post.myReaction]) delete counts[post.myReaction];
    }

    if (next) counts[next] = (counts[next] || 0) + 1;

    setPosts((prev) =>
      prev.map((row) =>
        row.uuid === post.uuid
          ? {
              ...row,
              myReaction: next,
              reactions: counts,
              reactionCount: Object.values(counts).reduce((s, n) => s + n, 0),
            }
          : row,
      ),
    );

    const response = await reactToFeedPost(post.uuid, next);

    if (response?.status === false) {
      // Put it back the way it was.
      setPosts((prev) =>
        prev.map((row) =>
          row.uuid === post.uuid
            ? {
                ...row,
                myReaction: post.myReaction,
                reactions: post.reactions,
                reactionCount: post.reactionCount,
              }
            : row,
        ),
      );
      toast.error(response.message || "Failed to react");
      return;
    }

    const truth = response.body || response;

    setPosts((prev) =>
      prev.map((row) =>
        row.uuid === post.uuid
          ? {
              ...row,
              reactions: truth.reactions || {},
              reactionCount: truth.reactionCount || 0,
              myReaction: truth.myReaction || null,
            }
          : row,
      ),
    );
  };

  // Resharing puts a post of your own at the top of the feed pointing at the
  // original, so the feed is re-read rather than patched in place.
  const onRepost = async (post) => {
    const response = await repostFeedPost(post.uuid);

    if (response?.status === false) {
      toast.error(response.message || "Failed to repost");
      return;
    }

    const truth = response.body || response;
    toast.success(truth.reposted ? "Reposted" : "Repost removed");

    setLoading(true);
    load();
  };

  const onSave = async (post) => {
    // The bookmark fills straight away; the server's count follows.
    setPosts((prev) =>
      prev.map((row) =>
        row.uuid === post.uuid ? { ...row, saved: !row.saved } : row,
      ),
    );

    const response = await saveFeedPost(post.uuid);

    if (response?.status === false) {
      setPosts((prev) =>
        prev.map((row) =>
          row.uuid === post.uuid ? { ...row, saved: post.saved } : row,
        ),
      );
      toast.error(response.message || "Failed to save");
      return;
    }

    const truth = response.body || response;

    setPosts((prev) =>
      prev.map((row) =>
        row.uuid === post.uuid
          ? { ...row, saved: truth.saved, saveCount: truth.saveCount }
          : row,
      ),
    );

    // In the saved view, unsaving takes the post off the screen it is on.
    if (!truth.saved && sort === "saved") {
      setPosts((prev) => prev.filter((row) => row.uuid !== post.uuid));
    }
  };

  const onRemovePost = async () => {
    const response = await removeFeedPost(confirming.uuid);

    if (response?.status === false) {
      toast.error(response.message || "Failed to remove the post");
      return;
    }

    setPosts((prev) => prev.filter((row) => row.uuid !== confirming.uuid));
    setMeta((prev) => ({ ...prev, count: Math.max(prev.count - 1, 0) }));
    setConfirming(null);
    toast.success("Post removed");
  };

  const onRemoveComment = async (post, comment) => {
    const response = await removeFeedComment(comment.uuid);

    if (response?.status === false) {
      toast.error(response.message || "Failed to remove the comment");
      return;
    }

    setThreads((prev) => ({
      ...prev,
      [post.uuid]: (prev[post.uuid] || []).filter(
        (row) => row.uuid !== comment.uuid,
      ),
    }));

    setPosts((prev) =>
      prev.map((row) =>
        row.uuid !== post.uuid
          ? row
          : {
              ...row,
              commentCount: Math.max(row.commentCount - 1, 0),
              comments: row.comments.filter((c) => c.uuid !== comment.uuid),
            },
      ),
    );

    toast.success("Comment removed");
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* THE FEED */}
        <div className="min-w-0">
          {/* HERO */}
          <div className="relative mb-6 min-h-[180px] overflow-hidden rounded-2xl bg-black shadow-sm">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

            <div className="relative z-10 max-w-2xl p-8 text-white">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
                Live Feed
              </span>

              <h1 className="mb-2 text-2xl font-bold leading-tight drop-shadow-lg md:text-3xl">
                What the community is talking about
              </h1>

              <p className="max-w-xl text-sm leading-6 text-white/85 drop-shadow-md">
                Ask a question, share a win, offer a hand. Everyone on Anza
                Connect reads the same feed — startups, mentors, investors and
                the programme team.
              </p>
            </div>
          </div>

          {/* COMPOSER */}
          <form
            onSubmit={onPost}
            className="mb-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/50"
          >
            <div className="flex items-center gap-3">
              <Avatar person={userDetails} />

              {open ? (
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                  placeholder="Add a headline (optional)"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#111a2e] outline-none focus:border-[#082d77]"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="flex-1 rounded-full bg-slate-50 px-5 py-3 text-left text-sm text-[#8a8f98] transition hover:bg-slate-100"
                >
                  Hi {firstName(userDetails?.name)}, what&apos;s on your mind?
                </button>
              )}

              {!open ? (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  aria-label="Add an image"
                  className="shrink-0 rounded-lg p-2.5 text-lg text-slate-400 transition hover:bg-slate-50 hover:text-[#082d77]"
                >
                  <FaImage />
                </button>
              ) : null}
            </div>

            {open ? (
              <>
                <textarea
                  rows={4}
                  autoFocus
                  value={draft.body}
                  onChange={(event) =>
                    setDraft({ ...draft, body: event.target.value })
                  }
                  placeholder="What would you like to share with the community?"
                  className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm leading-6 text-[#111a2e] outline-none focus:border-[#082d77]"
                />

                {preview ? (
                  <div className="relative mt-3 overflow-hidden rounded-xl">
                    <img
                      src={preview}
                      alt="Attached"
                      className="max-h-72 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onPickImage(null)}
                      aria-label="Remove image"
                      className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#082d77] transition hover:bg-slate-50">
                    <FaImage /> Photo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(event) =>
                        onPickImage(event.target.files?.[0] || null)
                      }
                    />
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={resetComposer}
                      disabled={posting}
                      className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={posting}
                      className="rounded-lg bg-[#082d77] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54] disabled:opacity-60"
                    >
                      {posting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </form>

          {/* SORT AND SEARCH */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-slate-200/50">
            <div className="relative">
              {/* No drawn chevron here: the select brings its own. */}
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-[#344054] outline-none focus:border-[#082d77]"
              >
                <option value="latest">Latest activity</option>
                <option value="discussed">Most discussed</option>
                <option value="saved">Saved</option>
              </select>
            </div>

            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search the feed..."
                className="w-56 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#082d77]"
              />
            </div>
          </div>

          {/* NEW POSTS WAITING */}
          {waiting > 0 ? (
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                load();
              }}
              className="mb-4 w-full rounded-full bg-[#082d77] py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54]"
            >
              {waiting} new post{waiting === 1 ? "" : "s"} — show
            </button>
          ) : null}

          {/* POSTS */}
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              {keyword.trim()
                ? "Nothing in the feed matches that."
                : "Nothing here yet — be the first to post."}
            </div>
          ) : (
            <div className="space-y-4">
              {visible.map((post) => {
                const thread = threads[post.uuid] || post.comments || [];
                const isOpen = !!expanded[post.uuid];

                return (
                  <article
                    key={post.uuid}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-200/50"
                  >
                    <header className="flex items-start justify-between gap-3 p-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar person={post.author} size="h-11 w-11" />

                        <div className="min-w-0">
                          <p className="truncate text-sm">
                            <span className="font-black text-[#111a2e]">
                              {post.author?.name || "Member"}
                            </span>
                            <span className="ml-2 text-[#8a8f98]">
                              {label(post.author?.role)}
                            </span>
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-[#8a8f98]">
                            {when(post.createdAt)}
                            {post.repostOf ? (
                              <>
                                ·<FaRetweet /> reposted
                              </>
                            ) : null}
                          </p>
                        </div>
                      </div>

                      {post.canRemove ? (
                        <button
                          type="button"
                          onClick={() => setConfirming(post)}
                          aria-label="Remove post"
                          className="shrink-0 rounded-full p-2 text-slate-300 transition hover:bg-slate-50 hover:text-rose-600"
                        >
                          <FaTrash />
                        </button>
                      ) : null}
                    </header>

                    {post.imageUrl ? (
                      <img
                        src={`${server_url}${post.imageUrl}`}
                        alt={post.title || "Post"}
                        className="max-h-[420px] w-full bg-slate-50 object-cover"
                      />
                    ) : null}

                    <div className="p-5">
                      {post.title ? (
                        <h2 className="mb-1.5 text-lg font-black tracking-tight text-slate-950">
                          {post.title}
                        </h2>
                      ) : null}

                      {post.body ? (
                        <p className="whitespace-pre-wrap text-sm leading-6 text-[#475467]">
                          {post.body}
                        </p>
                      ) : null}

                      {/* A repost carries the original inside it, so the feed
                          shows what was shared and not just that it was. */}
                      {post.repostOf ? (
                        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                          <div className="flex items-center gap-3 p-3">
                            <Avatar
                              person={post.repostOf.author}
                              size="h-9 w-9"
                            />

                            <div className="min-w-0">
                              <p className="truncate text-sm">
                                <span className="font-black text-[#111a2e]">
                                  {post.repostOf.author?.name || "Member"}
                                </span>
                                <span className="ml-2 text-[#8a8f98]">
                                  {label(post.repostOf.author?.role)}
                                </span>
                              </p>
                              <p className="text-xs text-[#8a8f98]">
                                {when(post.repostOf.createdAt)}
                              </p>
                            </div>
                          </div>

                          {post.repostOf.imageUrl ? (
                            <img
                              src={`${server_url}${post.repostOf.imageUrl}`}
                              alt={post.repostOf.title || "Post"}
                              className="max-h-72 w-full bg-slate-50 object-cover"
                            />
                          ) : null}

                          <div className="p-3">
                            {post.repostOf.title ? (
                              <h3 className="mb-1 text-base font-black tracking-tight text-slate-950">
                                {post.repostOf.title}
                              </h3>
                            ) : null}

                            <p className="whitespace-pre-wrap text-sm leading-6 text-[#475467]">
                              {post.repostOf.body}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* WHO IS TALKING — and the way into the thread, now that
                        the Comment button is gone. */}
                    {post.commentCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggleThread(post)}
                        className="flex w-full min-w-0 items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                      >
                        {post.commenters.length ? (
                          <span className="flex -space-x-2">
                            {post.commenters.slice(0, 5).map((person) => (
                              <Avatar
                                key={person.uuid}
                                person={person}
                                size="h-8 w-8"
                              />
                            ))}
                          </span>
                        ) : null}

                        <span className="truncate text-xs text-[#667085]">
                          {`${post.commenters[0]?.name || "Someone"}${
                            post.commentCount > 1
                              ? ` and ${post.commentCount - 1} other${post.commentCount - 1 === 1 ? "" : "s"}`
                              : ""
                          } commented`}
                        </span>

                        <span className="ml-auto shrink-0 text-xs font-semibold text-[#082d77]">
                          {isOpen ? "Hide" : `Show ${post.commentCount}`}
                        </span>
                      </button>
                    ) : null}

                    {/* REACTIONS — one button holding all of them. A tap
                        likes; holding it, or hovering, opens the rest. */}
                    <footer className="relative flex flex-wrap items-center gap-3 px-3 py-2">
                      <div
                        className="relative"
                        onMouseEnter={() => openPicker(post.uuid)}
                        onMouseLeave={closePicker}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onReact(post, post.myReaction || "like")
                          }
                          onTouchStart={() => openPicker(post.uuid, 450)}
                          onTouchEnd={cancelPicker}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            setPicker(post.uuid);
                          }}
                          aria-pressed={!!post.myReaction}
                          title={
                            post.myReaction
                              ? `${REACTIONS[post.myReaction].label} — tap to take it back`
                              : "Like — hold for more"
                          }
                          className={`relative z-30 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 ${
                            post.myReaction
                              ? REACTIONS[post.myReaction].ink
                              : "text-[#667085]"
                          }`}
                        >
                          {!post.myReaction ? (
                            <FaRegThumbsUp />
                          ) : post.myReaction === "like" ? (
                            <FaThumbsUp />
                          ) : post.myReaction === "dislike" ? (
                            <FaThumbsDown />
                          ) : (
                            <span className="text-base leading-none">
                              {REACTIONS[post.myReaction].glyph}
                            </span>
                          )}

                          {post.myReaction
                            ? REACTIONS[post.myReaction].label
                            : "Like"}
                        </button>

                        {picker === post.uuid ? (
                          <>
                            <button
                              type="button"
                              onClick={closePickerNow}
                              aria-label="Close reactions"
                              className="fixed inset-0 z-20 cursor-default"
                            />

                            <div className="absolute bottom-full left-0 z-30 mb-1 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-lg">
                              {Object.keys(REACTIONS).map((kind) => (
                                <button
                                  key={kind}
                                  type="button"
                                  onClick={() => onReact(post, kind)}
                                  title={REACTIONS[kind].label}
                                  aria-label={REACTIONS[kind].label}
                                  className={`rounded-full px-2 py-1 text-xl transition hover:scale-125 ${
                                    post.myReaction === kind
                                      ? "bg-slate-100"
                                      : ""
                                  }`}
                                >
                                  {REACTIONS[kind].glyph}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleThread(post)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#667085] transition hover:bg-slate-50"
                      >
                        <FaRegComment />
                        Comments
                        {post.commentCount ? (
                          <span className="font-black">
                            {post.commentCount}
                          </span>
                        ) : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => onRepost(post)}
                        aria-pressed={post.reposted}
                        title={
                          post.reposted
                            ? "Remove your repost"
                            : "Share this with the feed"
                        }
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 ${
                          post.reposted ? "text-emerald-600" : "text-[#667085]"
                        }`}
                      >
                        <FaRetweet />
                        Repost
                        {post.repostCount ? (
                          <span className="font-black">
                            {post.repostCount}
                          </span>
                        ) : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSave(post)}
                        aria-pressed={post.saved}
                        title={
                          post.saved ? "Remove from saved" : "Save for later"
                        }
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 ${
                          post.saved ? "text-[#082d77]" : "text-[#667085]"
                        }`}
                      >
                        {post.saved ? <FaBookmark /> : <FaRegBookmark />}
                        {post.saved ? "Saved" : "Save"}
                      </button>

                      {/* Reach: people who have had this post on screen,
                          counted once each however often they scroll by. */}
                      <span
                        title={`${post.viewCount} ${post.viewCount === 1 ? "person has" : "people have"} seen this`}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#667085]"
                      >
                        <FaChartBar />
                        {post.viewCount}
                      </span>

                      {/* What everyone left, as the glyphs themselves. */}
                      {post.reactionCount ? (
                        <span className="ml-auto flex items-center gap-1 text-xs text-[#8a8f98]">
                          {Object.keys(REACTIONS)
                            .filter((kind) => post.reactions?.[kind])
                            .map((kind) => (
                              <span key={kind} title={REACTIONS[kind].label}>
                                {REACTIONS[kind].glyph}
                              </span>
                            ))}
                          {post.reactionCount}
                        </span>
                      ) : null}
                    </footer>

                    {isOpen ? (
                      <div className="bg-slate-50/60 p-5">
                        {thread.length ? (
                          <ul className="mb-4 space-y-3">
                            {thread.map((comment) => (
                              <li
                                key={comment.uuid}
                                className="flex items-start gap-3"
                              >
                                <Avatar
                                  person={comment.author}
                                  size="h-9 w-9"
                                />

                                <div className="min-w-0 flex-1 rounded-2xl bg-white p-3 shadow-sm shadow-slate-200/50">
                                  <p className="text-sm">
                                    <span className="font-bold text-[#111a2e]">
                                      {comment.author?.name || "Member"}
                                    </span>
                                    <span className="ml-2 text-xs text-[#8a8f98]">
                                      {label(comment.author?.role)} ·{" "}
                                      {when(comment.createdAt)}
                                    </span>
                                  </p>

                                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#475467]">
                                    {comment.body}
                                  </p>
                                </div>

                                {comment.canRemove ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onRemoveComment(post, comment)
                                    }
                                    aria-label="Remove comment"
                                    className="mt-2 shrink-0 text-xs text-slate-300 transition hover:text-rose-600"
                                  >
                                    <FaTrash />
                                  </button>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-500">
                            No comments yet — say the first thing.
                          </p>
                        )}
                      </div>
                    ) : null}

                    {/* Always here, whether or not the thread is open: a feed
                        you have to click twice to reply to is a feed nobody
                        replies to. */}
                    <div className="flex items-center gap-3 p-4 pt-2">
                      <Avatar person={userDetails} size="h-9 w-9" />

                      <input
                        value={replies[post.uuid] || ""}
                        onChange={(event) =>
                          setReplies((prev) => ({
                            ...prev,
                            [post.uuid]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            onReply(post);
                          }
                        }}
                        placeholder="Write a comment..."
                        className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#082d77] focus:bg-white"
                      />

                      <button
                        type="button"
                        onClick={() => onReply(post)}
                        disabled={
                          replying === post.uuid ||
                          !(replies[post.uuid] || "").trim()
                        }
                        aria-label="Send comment"
                        className="shrink-0 rounded-full bg-[#16a34a] p-3 text-white transition hover:bg-[#15803d] disabled:opacity-40"
                      >
                        <FaPaperPlane className="text-sm" />
                      </button>
                    </div>
                  </article>
                );
              })}

              {meta.hasMore ? (
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-[#082d77] transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load older posts"}
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* WHO IS HERE */}
        <aside className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/50">
            <h3 className="text-base font-black tracking-tight text-slate-950">
              About the feed
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              One board for the whole platform. Ask the community a question,
              share what worked, or answer someone else&apos;s — every post is
              visible to everyone signed in.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/50">
            <h3 className="mb-3 text-base font-black tracking-tight text-slate-950">
              Members
            </h3>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {members.recent.slice(0, 5).map((person) => (
                  <Avatar key={person.uuid} person={person} size="h-10 w-10" />
                ))}
              </div>

              {members.members > 5 ? (
                <span className="text-sm font-bold text-[#082d77]">
                  +{members.members - 5}
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-xs text-[#8a8f98]">
              {members.members} member{members.members === 1 ? "" : "s"} on Anza
              Connect
            </p>
          </div>

          {members.mostActive.length ? (
            <div className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/50">
              <h3 className="mb-3 text-base font-black tracking-tight text-slate-950">
                Most active
              </h3>

              <ul className="space-y-3">
                {members.mostActive.map((person) => (
                  <li key={person.uuid} className="flex items-center gap-3">
                    <Avatar person={person} size="h-10 w-10" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#111a2e]">
                        {person.name}
                      </p>
                      <p className="truncate text-xs text-[#8a8f98]">
                        {label(person.role)}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                      {person.posts}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

        </aside>
      </div>

      {/* CONFIRM */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              Remove this post?
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#667085]">
              It comes out of the feed along with its comments. Nothing is
              destroyed — the record is kept, it is simply no longer shown.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onRemovePost}
                className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveFeed;
