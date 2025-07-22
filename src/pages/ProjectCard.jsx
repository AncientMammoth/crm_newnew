import React from "react";
import { Link } from "react-router-dom";
import UpdateForm from "./UpdateForm";
import UpdateDisplay from "./UpdateDisplay";
import { motion } from "framer-motion";

export default function ProjectCard({
  record,
  update,
  notes,
  updateType,
  updateTypeOptions,
  error,
  onNotesChange,
  onTypeChange,
  onCreateUpdate,
  onExpandNote,
  userName,
  isSuccess,
  fullAccountName, // Accept the full account name as a prop
}) {
  const projectId = record.id;
  const account = record.fields.Account?.[0];
  
  // Get the account name from the record as a fallback
  const accountNameFromRecord = record.fields["Account Name (from Account)"]?.[0] || "N/A";

  // Use the full name if it's passed, otherwise use the fallback
  const accountName = fullAccountName || accountNameFromRecord;

  // Define status colors based on the project status
  const statusColors = {
    "Need Analysis": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "Negotiation": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Closed Won": "bg-green-500/10 text-green-400 border-green-500/20",
    "Closed Lost": "bg-red-500/10 text-red-400 border-red-500/20",
  };
  const statusColor = statusColors[record.fields["Project Status"]] || "bg-secondary text-muted-foreground border-border";

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#333333] rounded-2xl border border-border p-6"
    >
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Project Details Section */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Link
            to={`/projects/${projectId}`}
            className="font-light text-xl text-foreground hover:text-accent transition-colors"
          >
            {record.fields["Project Name"] || "Unnamed Project"}
          </Link>
          <div className="mt-3 text-sm space-y-2">
            <p className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${statusColor}`}>
                {record.fields["Project Status"] || "N/A"}
            </p>
            <p className="text-muted-foreground">
              Account:{" "}
              {account ? (
                <Link
                  to={`/accounts/${account}`}
                  className="text-accent hover:underline"
                >
                  {accountName}
                </Link>
              ) : (
                "N/A"
              )}
            </p>
          </div>
        </div>

        {/* Update Section */}
        <div className="flex-1 w-full">
            {isSuccess ? (
              <div className="flex items-center justify-center h-full bg-green-500/10 text-green-400 rounded-lg p-4 border border-green-500/20">
                <p className="font-light">✓ Update saved successfully!</p>
              </div>
            ) : update ? (
              <UpdateDisplay
                update={update}
                userName={userName}
                onExpand={() => onExpandNote(update)}
              />
            ) : (
              <UpdateForm
                notes={notes}
                updateType={updateType}
                updateTypeOptions={updateTypeOptions}
                onNotesChange={onNotesChange}
                onTypeChange={onTypeChange}
                onSubmit={onCreateUpdate}
                error={error}
              />
            )}
        </div>
      </div>
    </motion.div>
  );
}