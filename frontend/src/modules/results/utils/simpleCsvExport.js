export function exportEventReportToCSV(r) {
  if (!r) {
    alert('No report data available to export');
    return;
  }

  try {
    const L = [];
    
    // Header
    L.push("EVENT RESULTS REPORT");
    L.push(`Created: ${new Date().toLocaleString()}`);
    L.push("");
    
    // Event details
    L.push("=== EVENT DETAILS ===");
    L.push("Field,Value");
    L.push(`Event ID,${r.eventId}`);
    L.push(`Event Name,${csv(r.eventName)}`);
    L.push(`Description,${csv(r.eventDescription || 'N/A')}`);
    L.push(`Start Date,${new Date(r.startDate).toLocaleDateString()}`);
    L.push(`End Date,${new Date(r.endDate).toLocaleDateString()}`);
    L.push("");
    
    // Key metrics
    L.push("=== KEY METRICS ===");
    L.push("Metric,Value");
    L.push(`Total Votes,${r.totalVotes || 0}`);
    L.push(`Total Nominees,${r.totalNominees || 0}`);
    L.push(`Total Categories,${r.categories?.length || 0}`);
    L.push("");
    
    // Categories
    if (Array.isArray(r.categories) && r.categories.length > 0) {
      L.push("=== CATEGORIES ===");
      L.push("Category ID,Category Name");
      r.categories.forEach(cat => {
        L.push(`${cat.id},${csv(cat.name)}`);
      });
      L.push("");
    }
    
    // Winners
    L.push("=== WINNERS ===");
    L.push("Category,Winner,Votes,Category ID");
    if (r.winners && r.winners.length > 0) {
      r.winners.forEach(w => {
        L.push([csv(w.categoryName), csv(w.winnerName), w.votes, w.categoryId || ''].join(","));
      });
    } else {
      L.push("No winners data available");
    }
    L.push("");
    
    // Category vote counts
    L.push("=== CATEGORY VOTE COUNTS ===");
    L.push("Category,Total Votes,Category ID");
    if (r.categoryVoteCounts && r.categoryVoteCounts.length > 0) {
      r.categoryVoteCounts.forEach(cv => {
        L.push([csv(cv.categoryName), cv.totalVotes, cv.categoryId || ''].join(","));
      });
      L.push("");
      L.push(`TOTAL VOTES,${r.totalVotes || 0}`);
    } else {
      L.push("No vote count data available");
    }
    L.push("");
    
    // Detailed vote breakdown
    if (Array.isArray(r.nomineeVotesByCategory) && r.nomineeVotesByCategory.length > 0) {
      L.push("=== DETAILED VOTE BREAKDOWN ===");
      r.nomineeVotesByCategory.forEach(cat => {
        L.push("");
        L.push(`Category: ${csv(cat.categoryName)}`);
        L.push("Nominee,Votes,Nominee ID");
        if (cat.nomineeVotes && cat.nomineeVotes.length > 0) {
          cat.nomineeVotes.forEach(nv => {
            L.push([csv(nv.nomineeName), nv.votes, nv.nomineeId || ''].join(","));
          });
        }
      });
      L.push("");
    }
    
    // Top nominees
    if (r.topNominees && r.topNominees.length > 0) {
      L.push("=== TOP 10 NOMINEES ===");
      L.push("Rank,Nominee Name,Total Votes,Nominee ID");
      r.topNominees.slice(0, 10).forEach(nominee => {
        L.push([nominee.rank, csv(nominee.nomineeName), nominee.totalVotes, nominee.nomineeId || ''].join(","));
      });
      L.push("");
    }
    
    // All nominees
    if (Array.isArray(r.nominees) && r.nominees.length > 0) {
      L.push("=== ALL NOMINEES ===");
      L.push("Nominee ID,Nominee Name,Category,Category ID");
      r.nominees.forEach(n => {
        L.push([n.id || '', csv(n.name), csv(n.categoryName || ''), n.categoryId || ''].join(","));
      });
      L.push("");
    }
    
    // Daily vote timeline
    if (Array.isArray(r.dailyVoteCounts) && r.dailyVoteCounts.length > 0) {
      L.push("=== DAILY VOTE TIMELINE ===");
      L.push("Date,Votes");
      r.dailyVoteCounts.forEach(d => {
        const date = new Date(d.date).toLocaleDateString();
        L.push(`${date},${d.votes || 0}`);
      });
      L.push("");
    }
    
    // Summary
    L.push("=== REPORT SUMMARY ===");
    L.push(`Report Created,${new Date().toLocaleString()}`);
    L.push(`Event ID,${r.eventId}`);
    L.push(`Total Votes Collected,${r.totalVotes || 0}`);
    
    // Download the CSV file.
    const blob = new Blob([L.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    // Clean filename
    const eventName = r.eventName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `${eventName}_Report_${dateStr}.csv`;
    
    document.body.appendChild(a);
    a.click();
    a.remove();
    
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    
    console.log('CSV Export: Completed successfully');
    return true;
    
  } catch (error) {
    console.error('CSV Export: Error:', error);
    alert(`CSV export failed: ${error.message}`);
    return false;
  }
}

// Helper function to escape CSV values
function csv(v) {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}
