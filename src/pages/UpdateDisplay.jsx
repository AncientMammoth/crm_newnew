import React from "react";
import { Link } from "react-router-dom";

export default function UpdateDisplay({ update, userName, expanded, onExpand }) {
  if (!update || !update.fields) {
    return null; 
  }

  const notes = update.fields.Notes || "";
  const displayNotes = expanded || notes.length < 150 ? notes : `${notes.substring(0, 150)}...`;

  return (
    <div className="relative bg-secondary rounded-lg p-4 text-sm border border-border h-full">
      <span className="absolute top-3 right-3 text-xs font-medium bg-primary/10 text-accent px-2.5 py-1 rounded-full border border-accent/20">
        {update.fields["Update Type"]}
      </span>

      <div className="flex items-center text-xs text-muted-foreground mb-2">
        <span>
          <strong>By:</strong> {update.fields["Update Owner Name"]?.[0] || userName}
        </span>
        <span className="mx-2">|</span>
        <span>
          <strong>Date:</strong> {new Date(update.fields.Date).toLocaleDateString()}
        </span>
      </div>

      <p className="text-foreground whitespace-pre-wrap pt-2 font-light">{displayNotes}</p>
      
      <div className="flex justify-end gap-4 mt-3">
        {!expanded && notes.length > 150 && (
          <button onClick={onExpand} className="text-xs text-accent hover:underline font-medium">
            Show More
          </button>
        )}
        <Link to={`/updates/${update.id}`} className="text-xs text-accent hover:underline font-medium">
          View Details
        </Link>
      </div>
    </div>
  );
}
