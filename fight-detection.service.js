// Fight & Crowd Detection Module
// Real-time detection of conflicts and automatic security dispatch

module.exports = class FightDetectionService {
  constructor() {
    this.activeIncidents = [];
    this.securityTeams = [
      { id: 'SEC-01', location: 'Downtown', available: true, responseTime: '2min' },
      { id: 'SEC-02', location: 'North Zone', available: true, responseTime: '3min' },
      { id: 'SEC-03', location: 'East Zone', available: true, responseTime: '2.5min' },
      { id: 'SEC-04', location: 'West Zone', available: true, responseTime: '3.5min' }
    ];
  }

  /**
   * Detect fight/conflict in crowd
   * Analyzes: crowd density, movement patterns, noise levels, reported incidents
   */
  detectFight(data) {
    const {
      crowdDensity,        // 0-100 (percentage)
      movementAnomalies,   // boolean
      audioAnalysis,       // decibels/aggressive sounds
      reportsCount,        // number of emergency reports
      location,
      confidence           // 0-100 detection confidence
    } = data;

    // Calculate fight probability using multiple signals
    let fightScore = 0;

    if (crowdDensity > 70) fightScore += 20;  // Dense crowds can indicate conflict
    if (movementAnomalies) fightScore += 25;  // Erratic movement patterns
    if (audioAnalysis > 85) fightScore += 30; // Loud/aggressive sounds
    if (reportsCount > 2) fightScore += 25;   // Multiple emergency reports

    fightScore = Math.min(fightScore, 100);

    const detectionResult = {
      incidentId: `INC-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'Fight/Conflict Detected',
      location,
      detectionConfidence: fightScore,
      severity: fightScore > 80 ? 'CRITICAL' : fightScore > 60 ? 'HIGH' : 'MEDIUM',
      crowdDensity,
      movementAnomalies,
      audioLevel: audioAnalysis,
      crowdReports: reportsCount,
      status: 'INCIDENT_ACTIVE'
    };

    // If high confidence, auto-dispatch security
    if (fightScore > 60) {
      const dispatch = this.autoDispatchSecurity(detectionResult);
      detectionResult.securityDispatch = dispatch;
    }

    this.activeIncidents.push(detectionResult);
    return detectionResult;
  }

  /**
   * Automatically dispatch nearest security team
   */
  autoDispatchSecurity(incident) {
    // Find nearest available security team (simulation)
    const nearestTeam = this.securityTeams
      .filter(team => team.available)
      .sort((a, b) => {
        const responseA = parseInt(a.responseTime);
        const responseB = parseInt(b.responseTime);
        return responseA - responseB;
      })[0];

    if (!nearestTeam) {
      return { status: 'NO_AVAILABLE_TEAMS', error: 'All security teams busy' };
    }

    // Mark team as dispatched
    nearestTeam.available = false;
    nearestTeam.dispatchedTo = incident.location;
    nearestTeam.dispatchTime = new Date().toISOString();

    return {
      dispatchId: `DSP-${Date.now()}`,
      securityTeamId: nearestTeam.id,
      teamLocation: nearestTeam.location,
      estimatedResponseTime: nearestTeam.responseTime,
      dispatchStatus: 'DISPATCHED_TO_LOCATION',
      dispatchTime: nearestTeam.dispatchTime,
      incidentId: incident.incidentId,
      targetLocation: incident.location
    };
  }

  /**
   * Get all active incidents
   */
  getActiveIncidents() {
    return {
      count: this.activeIncidents.length,
      incidents: this.activeIncidents,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Update incident status (resolved, escalated, etc)
   */
  updateIncidentStatus(incidentId, status) {
    const incident = this.activeIncidents.find(inc => inc.incidentId === incidentId);
    
    if (!incident) {
      return { error: 'Incident not found' };
    }

    // If resolved, free up security team
    if (status === 'RESOLVED') {
      const dispatch = incident.securityDispatch;
      if (dispatch && dispatch.securityTeamId) {
        const team = this.securityTeams.find(t => t.id === dispatch.securityTeamId);
        if (team) {
          team.available = true;
          team.dispatchedTo = null;
        }
      }
    }

    incident.status = status;
    incident.lastUpdate = new Date().toISOString();
    
    return { success: true, incident };
  }

  /**
   * Get security team status
   */
  getSecurityStatus() {
    const available = this.securityTeams.filter(t => t.available).length;
    const deployed = this.securityTeams.filter(t => !t.available).length;

    return {
      totalTeams: this.securityTeams.length,
      availableTeams: available,
      deployedTeams: deployed,
      responseTime: '2-3.5 minutes',
      teams: this.securityTeams
    };
  }
};
