import React from "react";
import { Link } from "react-router-dom";
import { Building2, ArrowRight, PlusIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function AccountCard({ record, onCreateProject }) {
  const accountName = record.fields["Account Name"] || "Unnamed Account";
  const accountType = record.fields["Account Type"] || "No Type";
  const accountDescription = record.fields["Account Description"] || "";
  const projectCount = record.fields.Projects?.length || 0;

  const getBadgeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "client":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "channel partner":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "vendor":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "technology partner":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-secondary text-muted-foreground border-border";
    }
  };

  return (
    <motion.div 
        className="bg-[#333333] rounded-2xl border border-border overflow-hidden hover:border-accent/50 transition-colors duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="bg-secondary p-3 rounded-lg border border-border">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <Link
                to={`/accounts/${record.id}`}
                className="text-lg font-light text-foreground hover:text-accent transition-colors"
              >
                {accountName}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getBadgeColor(accountType)}`}>
                  {accountType}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={onCreateProject}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-secondary rounded-md hover:bg-[#2E2E2E] focus:outline-none focus:ring-2 focus:ring-primary transition-colors shadow-sm border border-border"
          >
            <PlusIcon className="h-4 w-4" />
            New Project
          </button>
        </div>
        
        <div className="mt-4 text-sm font-light text-muted-foreground">
          {accountDescription ? (
            accountDescription.length > 150 ? (
              `${accountDescription.substring(0, 150)}...`
            ) : (
              accountDescription
            )
          ) : (
            <span className="text-muted-foreground/50 italic">No description available</span>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
          <div className="flex gap-6">
              <div>
                <span className="text-xs text-muted-foreground">Projects</span>
                <p className="font-semibold text-foreground">{projectCount}</p>
              </div>
          </div>
          
          <Link 
            to={`/accounts/${record.id}`}
            className="flex items-center text-sm text-accent hover:underline font-medium"
          >
            View Details
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
