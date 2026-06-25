import jsPDF from 'jspdf';

export const exportSimpleEventReportToPDF = (reportData) => {
  console.log('PDF Export: Starting...');
  
  if (!reportData) {
    alert('No report data available to export');
    return;
  }

  try {
    const doc = new jsPDF();
    
    // Report colors
    const colors = {
      primaryDark: [30, 58, 138],      // Deep blue
      primaryLight: [59, 130, 246],    // Bright blue
      accent: [236, 72, 153],          // Pink accent
      success: [34, 197, 94],          // Green
      warning: [251, 146, 60],         // Orange
      gold: [251, 191, 36],            // Gold
      silver: [203, 213, 225],         // Silver
      bronze: [205, 127, 50],          // Bronze
      text: [17, 24, 39],              // Almost black
      textLight: [107, 114, 128],      // Gray
      bg: [249, 250, 251],             // Light gray
      white: [255, 255, 255],
      border: [229, 231, 235],
    };

    let y = 20;
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const bottom = 280;
    
    const ensurePage = (delta = 10) => {
      if (y + delta > bottom) {
        doc.addPage();
        y = 20;
      }
    };

    // Header band
    doc.setFillColor(...colors.primaryDark);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    // Accent stripe
    doc.setFillColor(...colors.accent);
    doc.rect(0, 55, pageWidth, 5, 'F');
    
    // Title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.white);
    doc.text('EVENT RESULTS', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 255);
    doc.text('Comprehensive Analytics Report', pageWidth / 2, 38, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 220);
    doc.text(`Created: ${new Date().toLocaleString()}`, pageWidth / 2, 48, { align: 'center' });
    
    y = 75;

    // Section headers
    const drawSectionHeader = (title) => {
      ensurePage(20);
      
      // Header background with rounded corners
      doc.setFillColor(...colors.primaryLight);
      doc.roundedRect(margin, y - 8, contentWidth, 14, 3, 3, 'F');
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.white);
      doc.text(title, margin + 5, y);
      
      y += 12;
    };

    // Info cards
    const drawInfoCard = (label, value, color = colors.primaryLight) => {
      ensurePage();
      
      doc.setFillColor(...colors.bg);
      doc.roundedRect(margin, y - 5, contentWidth, 10, 2, 2, 'F');
      
      // Left border accent
      doc.setFillColor(...color);
      doc.rect(margin, y - 5, 3, 10, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textLight);
      doc.text(label, margin + 8, y);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.text);
      doc.text(String(value), pageWidth - margin - 5, y, { align: 'right' });
      
      y += 12;
    };

    // Event overview
    drawSectionHeader('EVENT OVERVIEW');
    
    y += 5;
    
    // Event name highlight
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, y - 6, contentWidth, 18, 3, 3, 'F');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primaryDark);
    doc.text(reportData.eventName, pageWidth / 2, y + 2, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    doc.text(`Event ID: ${reportData.eventId}`, pageWidth / 2, y + 9, { align: 'center' });
    
    y += 25;
    
    if (reportData.eventDescription) {
      ensurePage();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textLight);
      const descLines = doc.splitTextToSize(reportData.eventDescription, contentWidth - 10);
      descLines.forEach(line => {
        ensurePage();
        doc.text(line, pageWidth / 2, y, { align: 'center' });
        y += 5;
      });
      y += 5;
    }
    
    // Event dates
    drawInfoCard('Start Date', new Date(reportData.startDate).toLocaleDateString());
    drawInfoCard('End Date', new Date(reportData.endDate).toLocaleDateString());
    
    y += 8;

    // Key metrics
    drawSectionHeader('KEY METRICS');
    
    y += 5;
    
    const cardWidth = (contentWidth - 10) / 3;
    const metrics = [
      { label: 'TOTAL VOTES', value: reportData.totalVotes, color: colors.primaryLight },
      { label: 'NOMINEES', value: reportData.totalNominees, color: colors.success },
      { label: 'CATEGORIES', value: reportData.categories.length, color: colors.accent },
    ];
    
    metrics.forEach((metric, idx) => {
      const x = margin + (idx * (cardWidth + 5));
      
      // Card background
      doc.setFillColor(...colors.white);
      doc.roundedRect(x, y, cardWidth, 22, 3, 3, 'F');
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cardWidth, 22, 3, 3, 'S');
      
      // Top accent bar
      doc.setFillColor(...metric.color);
      doc.rect(x, y, cardWidth, 3, 'F');
      
      // Label
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textLight);
      doc.text(metric.label, x + cardWidth / 2, y + 10, { align: 'center' });
      
      // Value
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...metric.color);
      doc.text(String(metric.value), x + cardWidth / 2, y + 18, { align: 'center' });
    });
    
    y += 30;

    // Categories
    if (Array.isArray(reportData.categories) && reportData.categories.length > 0) {
      drawSectionHeader('CATEGORIES');
      y += 5;
      
      const cols = 3;
      const chipWidth = (contentWidth - 10) / cols;
      let col = 0;
      
      reportData.categories.forEach((cat, idx) => {
        if (col === 0) ensurePage(12);
        
        const x = margin + (col * (chipWidth + 5));
        const chipY = y;
        
        // Chip background
        doc.setFillColor(...colors.bg);
        doc.roundedRect(x, chipY - 4, chipWidth, 9, 12, 12, 'F');
        
        // Chip border
        doc.setDrawColor(...colors.primaryLight);
        doc.setLineWidth(1);
        doc.roundedRect(x, chipY - 4, chipWidth, 9, 12, 12, 'S');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primaryLight);
        const catName = cat.name.length > 18 ? cat.name.substring(0, 15) + '...' : cat.name;
        doc.text(catName, x + chipWidth / 2, chipY + 1, { align: 'center' });
        
        col++;
        if (col >= cols) {
          col = 0;
          y += 12;
        }
      });
      
      if (col > 0) y += 12;
      y += 8;
    }

    // Winners
    if (reportData.winners && reportData.winners.length > 0) {
      drawSectionHeader('WINNERS');
      y += 5;
      
      reportData.winners.forEach((winner, idx) => {
        ensurePage(24);
        
        // Winner card
        doc.setFillColor(...colors.white);
        doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
        
        // Left colored accent with trophy indicator
        const medalColor = idx === 0 ? colors.gold : idx === 1 ? colors.silver : idx === 2 ? colors.bronze : colors.primaryLight;
        doc.setFillColor(...medalColor);
        doc.roundedRect(margin, y, 6, 20, 3, 3, 'F');
        
        // Border
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'S');
        
        // Trophy symbol for top 3
        if (idx < 3) {
          doc.setFontSize(14);
          doc.setTextColor(...medalColor);
          doc.text(['1ST', '2ND', '3RD'][idx], margin + 12, y + 8);
        }
        
        // Category badge
        doc.setFillColor(...colors.primaryLight);
        doc.roundedRect(margin + 12, y + 4, 55, 7, 3, 3, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.white);
        const catName = winner.categoryName.length > 20 ? winner.categoryName.substring(0, 17) + '...' : winner.categoryName;
        doc.text(catName.toUpperCase(), margin + 39.5, y + 8, { align: 'center' });
        
        // Winner name
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.text);
        const winnerName = winner.winnerName.length > 30 ? winner.winnerName.substring(0, 27) + '...' : winner.winnerName;
        doc.text(winnerName, margin + 12, y + 15);
        
        // Votes badge
        doc.setFillColor(...colors.success);
        doc.roundedRect(pageWidth - margin - 35, y + 6, 30, 9, 4, 4, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.white);
        doc.text(`${winner.votes}`, pageWidth - margin - 20, y + 11, { align: 'center' });
        doc.setFontSize(6);
        doc.text('VOTES', pageWidth - margin - 20, y + 14, { align: 'center' });
        
        y += 23;
      });
      
      y += 8;
    }

    // Category vote counts
    if (Array.isArray(reportData.categoryVoteCounts) && reportData.categoryVoteCounts.length > 0) {
      drawSectionHeader('CATEGORY VOTE DISTRIBUTION');
      y += 5;
      
      const maxVotes = Math.max(...reportData.categoryVoteCounts.map(c => c.totalVotes), 1);
      
      reportData.categoryVoteCounts.forEach(cat => {
        ensurePage(12);
        
        const barPercent = (cat.totalVotes / maxVotes);
        const barWidth = (contentWidth - 75) * barPercent;
        
        // Category name
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.text);
        const catName = cat.categoryName.length > 12 ? cat.categoryName.substring(0, 10) + '..' : cat.categoryName;
        doc.text(catName, margin, y, { maxWidth: 50 });
        
        // Bar background
        doc.setFillColor(...colors.bg);
        doc.roundedRect(margin + 55, y - 4, contentWidth - 75, 7, 3, 3, 'F');
        
        // Bar fill
        doc.setFillColor(...colors.primaryLight);
        doc.roundedRect(margin + 55, y - 4, Math.max(2, barWidth), 7, 3, 3, 'F');
        
        // Vote count
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primaryDark);
        doc.text(String(cat.totalVotes), pageWidth - margin, y, { align: 'right' });
        
        y += 10;
      });
      
      y += 8;
    }

    // Detailed vote breakdown
    if (Array.isArray(reportData.nomineeVotesByCategory) && reportData.nomineeVotesByCategory.length > 0) {
      drawSectionHeader('DETAILED VOTE BREAKDOWN');
      y += 5;
      
      reportData.nomineeVotesByCategory.forEach(cat => {
        ensurePage(20);
        
        // Category header
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(margin, y - 3, contentWidth, 8, 2, 2, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primaryDark);
        doc.text(cat.categoryName, margin + 3, y + 2);
        y += 10;
        
        cat.nomineeVotes.forEach(nv => {
          ensurePage();
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...colors.text);
          const nomineeName = nv.nomineeName.length > 45 ? nv.nomineeName.substring(0, 42) + '...' : nv.nomineeName;
          doc.text(`- ${nomineeName}`, margin + 5, y);
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.primaryLight);
          doc.text(`${nv.votes}`, pageWidth - margin - 5, y, { align: 'right' });
          
          y += 6;
        });
        
        y += 6;
      });
      
      y += 5;
    }

    // Top nominees
    if (reportData.topNominees && reportData.topNominees.length > 0) {
      drawSectionHeader('TOP 10 NOMINEES');
      y += 5;
      
      reportData.topNominees.slice(0, 10).forEach((nominee, idx) => {
        ensurePage(12);
        
        const rankColors = [colors.gold, colors.silver, colors.bronze];
        const rankColor = idx < 3 ? rankColors[idx] : colors.textLight;
        
        // Row background
        doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251);
        doc.roundedRect(margin, y - 4, contentWidth, 10, 2, 2, 'F');
        
        // Rank badge
        doc.setFillColor(...rankColor);
        doc.circle(margin + 6, y + 1, 4, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.white);
        doc.text(String(nominee.rank), margin + 6, y + 2, { align: 'center' });
        
        // Nominee name
        doc.setFontSize(10);
        doc.setFont('helvetica', idx < 3 ? 'bold' : 'normal');
        doc.setTextColor(...colors.text);
        const nomineeName = nominee.nomineeName.length > 35 ? nominee.nomineeName.substring(0, 32) + '...' : nominee.nomineeName;
        doc.text(nomineeName, margin + 15, y + 1);
        
        // Vote count
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primaryLight);
        doc.text(`${nominee.totalVotes} votes`, pageWidth - margin - 5, y + 1, { align: 'right' });
        
        y += 11;
      });
      
      y += 8;
    }

    // Daily vote timeline
    if (Array.isArray(reportData.dailyVoteCounts) && reportData.dailyVoteCounts.length > 0) {
      drawSectionHeader('DAILY VOTE TIMELINE');
      y += 5;
      
      const maxDailyVotes = Math.max(...reportData.dailyVoteCounts.map(d => d.votes || 0), 1);
      
      reportData.dailyVoteCounts.forEach((d, idx) => {
        ensurePage(10);
        
        const date = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const barPercent = (d.votes / maxDailyVotes);
        const barWidth = (contentWidth - 90) * barPercent;
        
        // Date
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textLight);
        doc.text(date, margin, y);
        
        // Bar background
        doc.setFillColor(...colors.bg);
        doc.roundedRect(margin + 35, y - 3, contentWidth - 90, 6, 3, 3, 'F');
        
        // Bar with gradient
        const intensity = Math.floor(180 + (barPercent * 75));
        doc.setFillColor(59, 130, Math.min(255, intensity));
        doc.roundedRect(margin + 35, y - 3, Math.max(2, barWidth), 6, 3, 3, 'F');
        
        // Vote count
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primaryDark);
        doc.text(String(d.votes), pageWidth - margin, y, { align: 'right' });
        
        y += 9;
      });
    }

    // FOOTER
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textLight);
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
      const footerText = reportData.eventName.length > 40 ? reportData.eventName.substring(0, 37) + '...' : reportData.eventName;
      doc.text(`Event Report - ${footerText}`, margin, 290);
    }

    // Save
    const fileName = `${reportData.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('PDF Export: Completed successfully');
    return true;
    
  } catch (error) {
    console.error('PDF Export: Error:', error);
    alert(`PDF export failed: ${error.message}`);
    return false;
  }
};

export const exportEventReportToPDF = exportSimpleEventReportToPDF;
