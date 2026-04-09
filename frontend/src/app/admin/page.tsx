"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  checkDb,
  createRegenAction,
  createTeamAction,
} from "../actions/dbActions";

export default function AdminPage() {
  const [status, setStatus] = useState("");

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          {/* CRITICAL: Navigation back to Home */}
          <Link
            href="/"
            className="text-teal-500 text-xs font-bold uppercase tracking-widest hover:text-white transition"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-5xl font-black italic tracking-tighter mt-4">
            ADMINISTRATION
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-gray-900/40 p-8 rounded-2xl border border-gray-800">
            <h3 className="text-sm font-bold mb-4 uppercase text-gray-500">
              Database Tools
            </h3>
            <button
              onClick={async () => {
                await createTeamAction();
                setStatus("Team Generated");
              }}
              className="w-full bg-teal-600 py-3 rounded-xl font-bold hover:bg-teal-500 transition"
            >
              Generate Random Team
            </button>
            {status && (
              <p className="mt-4 text-teal-400 font-mono text-xs">{status}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
