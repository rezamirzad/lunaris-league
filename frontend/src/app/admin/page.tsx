"use client";

import { useState, useEffect } from "react";
import {
  getNationalitiesAction,
  getLeaguesByNationAction,
  generateTeamPreviewAction,
  saveTeamAction,
  getTeamCountAction,
} from "../actions/dbActions";
import { Team } from "../models";

export default function AdminPage() {
  const [nations, setNations] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [selectedNation, setSelectedNation] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("");
  const [teamCount, setTeamCount] = useState<number | null>(null);

  // Preview State
  const [previewTeam, setPreviewTeam] = useState<Team | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    getNationalitiesAction().then(setNations);
  }, []);

  // Fetch count when league is selected
  useEffect(() => {
    if (selectedLeague) {
      getTeamCountAction(selectedLeague).then(setTeamCount);
    } else {
      setTeamCount(null);
    }
  }, [selectedLeague]);

  const handleGeneratePreview = async () => {
    setIsPending(true);
    const result = await generateTeamPreviewAction(
      selectedLeague,
      selectedNation,
    );
    if (result.success && result.team) {
      setPreviewTeam(result.team);
    }
    setIsPending(false);
  };

  const handleConfirmSave = async () => {
    if (!previewTeam) return;
    setIsPending(true);
    const result = await saveTeamAction(previewTeam);
    if (result.success) {
      setPreviewTeam(null); // Clear preview
      const newCount = await getTeamCountAction(selectedLeague); // Refresh count
      setTeamCount(newCount);
      alert(result.message);
    } else {
      alert(result.error);
    }
    setIsPending(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Team Management</h1>

      {/* Selection Logic */}
      <div className="grid grid-cols-2 gap-4">
        <select
          value={selectedNation}
          onChange={(e) => setSelectedNation(e.target.value)}
          className="bg-gray-800 p-2 rounded"
        >
          <option value="">Select Nation</option>
          {nations.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <select
          value={selectedLeague}
          onChange={(e) => {
            setSelectedLeague(e.target.value);
            getLeaguesByNationAction(selectedNation).then(setLeagues);
          }}
          className="bg-gray-800 p-2 rounded"
        >
          <option value="">Select League</option>
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* League Stats */}
      {teamCount !== null && (
        <div className="bg-teal-900/20 border border-teal-500/50 p-4 rounded-lg">
          <p className="text-sm font-bold text-teal-400">
            Total Teams in League: {teamCount}
          </p>
        </div>
      )}

      {/* Action Button */}
      {!previewTeam && (
        <button
          onClick={handleGeneratePreview}
          disabled={!selectedLeague || isPending}
          className="w-full bg-teal-600 p-3 rounded-lg font-bold disabled:opacity-50"
        >
          Generate Random Team
        </button>
      )}

      {/* Approval View */}
      {previewTeam && (
        <div className="border border-white/10 bg-gray-900 p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-black text-teal-400 mb-4 uppercase tracking-tighter">
            Preview Generated Team
          </h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              <span className="text-gray-500">Name:</span> {previewTeam.name}
            </p>
            <p>
              <span className="text-gray-500">Rating:</span>{" "}
              {previewTeam.elo_rating}
            </p>
            <p>
              <span className="text-gray-500">Tactics:</span>{" "}
              {previewTeam.tactics.style} ({previewTeam.tactics.formation})
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleConfirmSave}
              className="flex-1 bg-green-600 p-2 rounded-lg font-bold hover:bg-green-500 transition"
            >
              Approve & Save
            </button>
            <button
              onClick={() => setPreviewTeam(null)}
              className="flex-1 bg-red-900/50 text-red-400 p-2 rounded-lg font-bold hover:bg-red-900 transition"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
