import { useState } from "react";
import { updateMemberStatus } from "../api/membersService";

export default function MemberManageRow({ member, isSelf, onUpdated }) {
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleToggleStatus() {
    setUpdating(true);
    setMessage(null);

    try {
      await updateMemberStatus(member.member_id, !member.is_active);
      setMessage({
        type: "success",
        text: member.is_active ? "Member blocked." : "Member unblocked.",
      });
      onUpdated?.();
    } catch (err) {
      const text =
        err.response?.data?.detail || "Something went wrong. Please try again.";
      setMessage({ type: "error", text });
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="manage-row">
      <div className="manage-row-info">
        <p className="manage-row-title">{member.name}</p>
        <p className="manage-row-author">{member.email}</p>
        <div className="member-row-meta">
          <span className="member-role">{member.role}</span>
          <span
            className={`member-status ${member.is_active ? "active" : "blocked"}`}
          >
            {member.is_active ? "Active" : "Blocked"}
          </span>
        </div>
        {message && (
          <p
            className={
              message.type === "success"
                ? "form-success manage-row-message"
                : "form-error manage-row-message"
            }
          >
            {message.text}
          </p>
        )}
      </div>
      {!isSelf && (
        <div className="manage-row-actions">
          <button
            type="button"
            className={member.is_active ? "btn-danger btn-small" : "btn-secondary btn-small"}
            onClick={handleToggleStatus}
            disabled={updating}
          >
            {updating ? "Updating..." : member.is_active ? "Block" : "Unblock"}
          </button>
        </div>
      )}
    </div>
  );
}
