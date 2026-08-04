import { useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaEnvelope,
  FaLayerGroup,
  FaSearch,
  FaUserTie,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";

// Shared directory page for the simple admin-side user lists (Staff, Finance
// Officers, Admins), matching the Mentors page design: hero, "Available X"
// heading, search, and a card grid.
//
// Props:
//   badge, title, description - hero text
//   chips        - short labels under the hero copy
//   heading      - section heading above the grid ("Available Staff")
//   users        - [{ uuid, name, email, image, createdAt, role }]
//   loading      - shows the loader
//   emptyText    - shown when there are no users at all
const HERO_IMAGE_URL = "/images/mentor_hero.svg";

const avatarFor = (user) =>
  user?.image ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.name || "User",
  )}&background=082d77&color=fff&size=400`;

const joinedYear = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear();
};

const UserDirectory = ({
  badge,
  title,
  description,
  chips = [],
  heading,
  users = [],
  loading = false,
  emptyText = "No users found.",
}) => {
  const [keyword, setKeyword] = useState("");

  const visible = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return users
      .filter((user) => {
        if (!q) return true;
        return [user?.name, user?.email, user?.role]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q));
      })
      .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
  }, [users, keyword]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            {badge}
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            {title}
          </h2>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            {description}
          </p>

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
              {chips.map((chip, index) => (
                <span key={chip} className="flex items-center gap-2">
                  {index === 0 ? <FaLayerGroup /> : <FaUserTie />}
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <h2 className="mb-6 text-2xl font-bold text-[#172033]">{heading}</h2>

      <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
        <div className="relative w-full sm:max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f98]" />
          <input
            type="text"
            placeholder="Search..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-md border border-black/10 bg-white px-4 py-3 pl-10 text-sm text-[#172033] outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-12 text-center text-sm text-[#6f6f72]">
          {emptyText}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-12 text-center text-sm text-[#6f6f72]">
          No one matches your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((user, key) => (
            <article
              key={user?.uuid || key}
              className="group overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="relative h-56 overflow-hidden bg-black">
                <img
                  src={avatarFor(user)}
                  alt={`${user?.name || "User"} profile`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                {user?.role && (
                  <div className="absolute bottom-4 left-4">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm backdrop-blur-sm">
                      {user.role}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex min-h-[190px] flex-col p-5">
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                  {user?.name || "Unnamed"}
                </h3>

                <div className="space-y-3 text-sm text-[#6f6f72]">
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="shrink-0" />
                    <span className="line-clamp-1">
                      {user?.email || "No email provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="shrink-0" />
                    <span>
                      {joinedYear(user?.createdAt)
                        ? `Joined ${joinedYear(user.createdAt)}`
                        : "Join date not set"}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDirectory;
