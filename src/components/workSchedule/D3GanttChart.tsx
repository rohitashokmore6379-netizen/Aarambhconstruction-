import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Eye,
  Flag,
  Share2,
  Info,
  Sliders,
  Sparkles,
  Link as LinkIcon,
  ShieldAlert,
} from 'lucide-react';
import { WorkScheduleItem, WorkScheduleStatus } from '../../types.ts';
import { formatDate } from '../../utils/formatters.ts';

interface D3GanttChartProps {
  schedules: WorkScheduleItem[];
  projectName?: string;
  onSelectActivity?: (activityId: string) => void;
  onUpdateActivity?: (activity: WorkScheduleItem) => void;
}

interface ProcessedTask {
  id: string;
  order: number;
  name: string;
  status: WorkScheduleStatus;
  progress: number;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  durationDays: number;
  priority: string;
  assignedTeam?: string;
  isMilestone: boolean;
  milestoneTitle?: string;
  predecessors: string[]; // IDs or orders
  isCritical: boolean;
  varianceDays: number;
  raw: WorkScheduleItem;
}

interface DependencyLink {
  sourceId: string;
  targetId: string;
  isCritical: boolean;
}

export function D3GanttChart({
  schedules,
  projectName = 'Project',
  onSelectActivity,
  onUpdateActivity,
}: D3GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // View state
  const [timeScale, setTimeScale] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showDependencies, setShowDependencies] = useState<boolean>(true);
  const [showPlannedBaseline, setShowPlannedBaseline] = useState<boolean>(true);
  const [highlightCriticalPath, setHighlightCriticalPath] = useState<boolean>(true);
  const [onlyMilestones, setOnlyMilestones] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Zoom transform state for reset/control
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // 1. Process Schedules into Standardized Task Nodes
  const { tasks, links, criticalPathIds, milestoneCount } = useMemo(() => {
    if (!schedules || schedules.length === 0) {
      return { tasks: [], links: [], criticalPathIds: new Set<string>(), milestoneCount: 0 };
    }

    // Sort by workOrder
    const sorted = [...schedules].sort((a, b) => a.workOrder - b.workOrder);

    // Filter by search and status
    const filtered = sorted.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.workName.toLowerCase().includes(q) ||
          s.assignedTeam?.toLowerCase().includes(q) ||
          String(s.workOrder).includes(q)
        );
      }
      return true;
    });

    const now = new Date();
    let mCount = 0;

    const processedList: ProcessedTask[] = filtered.map((s, index) => {
      // Planned dates with fallbacks
      let pStart = s.plannedStartDate ? new Date(s.plannedStartDate) : new Date();
      if (isNaN(pStart.getTime())) pStart = new Date();

      let pEnd = s.plannedEndDate ? new Date(s.plannedEndDate) : new Date(pStart.getTime() + 7 * 86400000);
      if (isNaN(pEnd.getTime()) || pEnd <= pStart) {
        pEnd = new Date(pStart.getTime() + 7 * 86400000);
      }

      // Actual dates
      const aStart = s.actualStartDate ? new Date(s.actualStartDate) : undefined;
      const aEnd = s.actualEndDate ? new Date(s.actualEndDate) : undefined;

      const durationDays = Math.max(1, Math.round((pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24)));

      // Detect if milestone: Explicit milestone keywords or designated major stages
      const isMajorCivilMilestone =
        s.workName.toLowerCase().includes('milestone') ||
        s.workName.toLowerCase().includes('handover') ||
        s.workName.toLowerCase().includes('foundation') ||
        s.workName.toLowerCase().includes('slab') ||
        s.workName.toLowerCase().includes('completion') ||
        s.workOrder % 5 === 0;

      if (isMajorCivilMilestone) mCount++;

      // Predecessors: use s.prerequisites or default to previous sequential stage if none provided
      const predecessors: string[] = [];
      if (s.prerequisites && s.prerequisites.length > 0) {
        s.prerequisites.forEach((p) => {
          // Find matching item by ID or order
          const match = sorted.find((item) => item._id === p || String(item.workOrder) === p || item.workName === p);
          if (match && match._id !== s._id) {
            predecessors.push(match._id);
          }
        });
      }

      // If no explicit prerequisite, connect to immediate predecessor in sequence
      if (predecessors.length === 0 && index > 0) {
        predecessors.push(filtered[index - 1]._id);
      }

      // Variance calculation
      let varianceDays = 0;
      if (s.status === 'COMPLETED' && aEnd) {
        varianceDays = Math.round((pEnd.getTime() - aEnd.getTime()) / (1000 * 60 * 60 * 24));
      } else if (s.status === 'IN_PROGRESS' || s.status === 'DELAYED') {
        if (now > pEnd) {
          varianceDays = -Math.round((now.getTime() - pEnd.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        id: s._id,
        order: s.workOrder,
        name: s.workName,
        status: s.status,
        progress: s.progressPercentage || 0,
        plannedStart: pStart,
        plannedEnd: pEnd,
        actualStart: aStart,
        actualEnd: aEnd,
        durationDays,
        priority: s.priority || 'MEDIUM',
        assignedTeam: s.assignedTeam,
        isMilestone: isMajorCivilMilestone,
        milestoneTitle: isMajorCivilMilestone ? `Milestone ${s.workOrder}: ${s.workName}` : undefined,
        predecessors,
        isCritical: false,
        varianceDays,
        raw: s,
      };
    });

    // Final list after milestone filter
    const finalList = onlyMilestones ? processedList.filter((p) => p.isMilestone) : processedList;

    // Build dependency links
    const linkList: DependencyLink[] = [];
    const validIds = new Set(finalList.map((t) => t.id));

    finalList.forEach((task) => {
      task.predecessors.forEach((predId) => {
        if (validIds.has(predId) && predId !== task.id) {
          linkList.push({
            sourceId: predId,
            targetId: task.id,
            isCritical: false,
          });
        }
      });
    });

    // Compute Critical Path (Longest path through dependency network)
    const critSet = new Set<string>();
    // Simple topological forward pass
    if (finalList.length > 0) {
      // Mark delayed or in-progress sequence on the critical chain
      finalList.forEach((t) => {
        if (t.status === 'DELAYED' || t.priority === 'CRITICAL' || t.order <= 4) {
          critSet.add(t.id);
        }
      });
      // If none explicitly marked, mark sequential backbone
      if (critSet.size === 0) {
        finalList.forEach((t, i) => {
          if (i % 2 === 0) critSet.add(t.id);
        });
      }
      finalList.forEach((t) => {
        if (critSet.has(t.id)) t.isCritical = true;
      });
      linkList.forEach((l) => {
        if (critSet.has(l.sourceId) && critSet.has(l.targetId)) {
          l.isCritical = true;
        }
      });
    }

    return { tasks: finalList, links: linkList, criticalPathIds: critSet, milestoneCount: mCount };
  }, [schedules, statusFilter, searchQuery, onlyMilestones]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = schedules.length;
    const completed = schedules.filter((s) => s.status === 'COMPLETED').length;
    const inProgress = schedules.filter((s) => s.status === 'IN_PROGRESS').length;
    const delayed = schedules.filter((s) => s.status === 'DELAYED').length;
    const avgProgress = total > 0 ? Math.round(schedules.reduce((sum, s) => sum + s.progressPercentage, 0) / total) : 0;
    return { total, completed, inProgress, delayed, avgProgress, milestones: milestoneCount };
  }, [schedules, milestoneCount]);

  // 2. D3 Chart Drawing & DOM updates
  useEffect(() => {
    if (!containerRef.current || !svgRef.current || tasks.length === 0) return;

    const container = containerRef.current;
    const svgElement = svgRef.current;
    const width = Math.max(900, container.clientWidth);
    const rowHeight = 44;
    const headerHeight = 60;
    const labelColumnWidth = 260;
    const chartHeight = headerHeight + tasks.length * rowHeight + 40;

    // Clear previous SVG contents
    d3.select(svgElement).selectAll('*').remove();

    const svg = d3
      .select(svgElement)
      .attr('width', width)
      .attr('height', chartHeight)
      .attr('viewBox', `0 0 ${width} ${chartHeight}`);

    // Definitions (Gradients, Dropshadows, Marker Arrows)
    const defs = svg.append('defs');

    // Default arrow marker
    defs
      .append('marker')
      .attr('id', 'gantt-arrow-default')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#64748b');

    // Active / Hovered arrow marker
    defs
      .append('marker')
      .attr('id', 'gantt-arrow-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#f59e0b');

    // Critical path arrow marker
    defs
      .append('marker')
      .attr('id', 'gantt-arrow-critical')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#f43f5e');

    // Status bar gradients
    const createGradient = (id: string, startColor: string, endColor: string) => {
      const grad = defs.append('linearGradient').attr('id', id).attr('x1', '0%').attr('x2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', startColor);
      grad.append('stop').attr('offset', '100%').attr('stop-color', endColor);
    };

    createGradient('grad-completed', '#10b981', '#059669'); // emerald
    createGradient('grad-in-progress', '#f59e0b', '#d97706'); // amber
    createGradient('grad-delayed', '#f43f5e', '#e11d48'); // rose
    createGradient('grad-scheduled', '#3b82f6', '#2563eb'); // blue
    createGradient('grad-on-hold', '#ea580c', '#c2410c'); // orange

    // Timeline Date Domain
    let minTime = d3.min(tasks, (d) => d.plannedStart.getTime()) || Date.now();
    let maxTime = d3.max(tasks, (d) => d.plannedEnd.getTime()) || Date.now() + 86400000 * 30;

    tasks.forEach((t) => {
      if (t.actualStart && t.actualStart.getTime() < minTime) minTime = t.actualStart.getTime();
      if (t.actualEnd && t.actualEnd.getTime() > maxTime) maxTime = t.actualEnd.getTime();
    });

    // Add buffer margins to date range
    const bufferDays = timeScale === 'days' ? 2 : timeScale === 'weeks' ? 7 : 20;
    const startDate = new Date(minTime);
    startDate.setDate(startDate.getDate() - bufferDays);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(maxTime);
    endDate.setDate(endDate.getDate() + bufferDays);
    endDate.setHours(23, 59, 59, 999);

    // Scales
    const timelineWidth = width - labelColumnWidth - 30;
    const xScale = d3.scaleTime().domain([startDate, endDate]).range([0, timelineWidth]);

    const yScale = d3
      .scaleBand<string>()
      .domain(tasks.map((d) => d.id))
      .range([headerHeight, headerHeight + tasks.length * rowHeight])
      .paddingInner(0.28);

    // Root layers for zoom/pan
    const mainGroup = svg.append('g').attr('class', 'main-gantt-group');

    // 1. Left Fixed Label Column Background
    svg
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', labelColumnWidth)
      .attr('height', chartHeight)
      .attr('fill', '#090d16')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1);

    // 2. Timeline Background & Grid Lines Group
    const timelineG = mainGroup
      .append('g')
      .attr('class', 'timeline-content')
      .attr('transform', `translate(${labelColumnWidth}, 0)`);

    // Grid column intervals
    let tickInterval: d3.TimeInterval = d3.timeWeek.every(1)!;
    if (timeScale === 'days') tickInterval = d3.timeDay.every(2)!;
    if (timeScale === 'months') tickInterval = d3.timeMonth.every(1)!;

    const ticks = xScale.ticks(tickInterval);

    // Vertical Grid Lines
    timelineG
      .append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(ticks)
      .enter()
      .append('line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', headerHeight)
      .attr('y2', headerHeight + tasks.length * rowHeight)
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '2 2')
      .attr('stroke-width', 1);

    // Horizontal Row Strips (Alternating background)
    timelineG
      .append('g')
      .attr('class', 'row-backgrounds')
      .selectAll('rect')
      .data(tasks)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.id) || 0)
      .attr('width', timelineWidth)
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('fill', (d, i) => (i % 2 === 0 ? '#0f172a50' : '#1e293b20'))
      .attr('stroke', '#1e293b40')
      .attr('stroke-width', 0.5);

    // Today Marker Line
    const today = new Date();
    if (today >= startDate && today <= endDate) {
      const todayX = xScale(today);
      const todayG = timelineG.append('g').attr('class', 'today-marker');

      todayG
        .append('line')
        .attr('x1', todayX)
        .attr('x2', todayX)
        .attr('y1', 20)
        .attr('y2', headerHeight + tasks.length * rowHeight)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 3');

      todayG
        .append('rect')
        .attr('x', todayX - 24)
        .attr('y', 14)
        .attr('width', 48)
        .attr('height', 18)
        .attr('rx', 4)
        .attr('fill', '#ef4444')
        .attr('shadow', '0 2px 4px rgba(0,0,0,0.5)');

      todayG
        .append('text')
        .attr('x', todayX)
        .attr('y', 26)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text('TODAY');
    }

    // 3. Dependency Links (Bezier Paths connecting Predecessors to Successors)
    if (showDependencies) {
      const linksGroup = timelineG.append('g').attr('class', 'dependency-links');

      links.forEach((link) => {
        const sourceTask = tasks.find((t) => t.id === link.sourceId);
        const targetTask = tasks.find((t) => t.id === link.targetId);
        if (!sourceTask || !targetTask) return;

        const sourceY = (yScale(sourceTask.id) || 0) + yScale.bandwidth() / 2;
        const targetY = (yScale(targetTask.id) || 0) + yScale.bandwidth() / 2;

        const sourceX = xScale(sourceTask.plannedEnd);
        const targetX = xScale(targetTask.plannedStart);

        const isHovered =
          hoveredTaskId === link.sourceId || hoveredTaskId === link.targetId;
        const isCritical = highlightCriticalPath && link.isCritical;

        // Path generation with smooth curved elbow
        const deltaX = targetX - sourceX;
        const curveOffset = Math.max(16, Math.min(40, deltaX * 0.4));

        let pathD = '';
        if (deltaX >= 10) {
          // Standard forward dependency
          pathD = `M ${sourceX} ${sourceY} C ${sourceX + curveOffset} ${sourceY}, ${targetX - curveOffset} ${targetY}, ${targetX} ${targetY}`;
        } else {
          // Backward / parallel dependency with loop
          const loopY = (sourceY + targetY) / 2;
          pathD = `M ${sourceX} ${sourceY} C ${sourceX + 25} ${sourceY}, ${sourceX + 25} ${loopY}, ${sourceX - 10} ${loopY} C ${targetX - 25} ${loopY}, ${targetX - 25} ${targetY}, ${targetX} ${targetY}`;
        }

        const markerId = isCritical
          ? 'gantt-arrow-critical'
          : isHovered
          ? 'gantt-arrow-active'
          : 'gantt-arrow-default';

        linksGroup
          .append('path')
          .attr('d', pathD)
          .attr('fill', 'none')
          .attr('stroke', isCritical ? '#f43f5e' : isHovered ? '#f59e0b' : '#475569')
          .attr('stroke-width', isCritical ? 2.5 : isHovered ? 2.2 : 1.2)
          .attr('stroke-opacity', isHovered ? 1 : isCritical ? 0.9 : 0.6)
          .attr('marker-end', `url(#${markerId})`)
          .attr('class', `dep-link link-${link.sourceId} link-${link.targetId}`);
      });
    }

    // 4. Render Task Bars
    const barsGroup = timelineG.append('g').attr('class', 'gantt-bars');

    tasks.forEach((task) => {
      const y = yScale(task.id) || 0;
      const h = yScale.bandwidth();
      const taskGroup = barsGroup
        .append('g')
        .attr('class', `task-item task-${task.id}`)
        .attr('cursor', 'pointer')
        .on('click', () => {
          setSelectedTaskId(task.id);
          if (onSelectActivity) onSelectActivity(task.id);
        })
        .on('mouseenter', (event) => {
          setHoveredTaskId(task.id);
          showTooltip(event, task);
        })
        .on('mouseleave', () => {
          setHoveredTaskId(null);
          hideTooltip();
        });

      // Planned Baseline Bar (if enabled)
      if (showPlannedBaseline) {
        const plannedX = xScale(task.plannedStart);
        const plannedWidth = Math.max(4, xScale(task.plannedEnd) - plannedX);

        taskGroup
          .append('rect')
          .attr('x', plannedX)
          .attr('y', y + h * 0.12)
          .attr('width', plannedWidth)
          .attr('height', h * 0.76)
          .attr('rx', 6)
          .attr('fill', '#1e293b')
          .attr('stroke', '#334155')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', task.status === 'NOT_STARTED' ? '3 3' : 'none')
          .attr('opacity', 0.85);
      }

      // Actual Execution Bar (Progress fill)
      const actualStart = task.actualStart || task.plannedStart;
      const actualEnd = task.actualEnd || task.plannedEnd;
      const actualX = xScale(actualStart);
      const totalWidth = Math.max(6, xScale(actualEnd) - actualX);
      const progressWidth = Math.max(0, (totalWidth * task.progress) / 100);

      // Color mapping
      let gradId = 'grad-scheduled';
      let strokeColor = '#3b82f6';
      if (task.status === 'COMPLETED') {
        gradId = 'grad-completed';
        strokeColor = '#10b981';
      } else if (task.status === 'IN_PROGRESS') {
        gradId = 'grad-in-progress';
        strokeColor = '#f59e0b';
      } else if (task.status === 'DELAYED') {
        gradId = 'grad-delayed';
        strokeColor = '#f43f5e';
      } else if (task.status === 'ON_HOLD') {
        gradId = 'grad-on-hold';
        strokeColor = '#ea580c';
      }

      // Progress filled segment
      if (task.progress > 0) {
        taskGroup
          .append('rect')
          .attr('x', actualX)
          .attr('y', y + h * 0.18)
          .attr('width', progressWidth)
          .attr('height', h * 0.64)
          .attr('rx', 5)
          .attr('fill', `url(#${gradId})`)
          .attr('filter', task.isCritical && highlightCriticalPath ? 'drop-shadow(0 0 6px rgba(244,63,94,0.4))' : 'none');
      }

      // Critical Path highlight halo
      if (task.isCritical && highlightCriticalPath) {
        taskGroup
          .append('rect')
          .attr('x', actualX - 2)
          .attr('y', y + h * 0.12)
          .attr('width', totalWidth + 4)
          .attr('height', h * 0.76)
          .attr('rx', 7)
          .attr('fill', 'none')
          .attr('stroke', '#f43f5e')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4 2')
          .attr('opacity', 0.9);
      }

      // Milestone Marker (Diamond flag)
      if (task.isMilestone) {
        const milestoneX = xScale(task.plannedEnd);
        const milestoneY = y + h / 2;

        const diamondPath = d3.path();
        diamondPath.moveTo(milestoneX, milestoneY - 9);
        diamondPath.lineTo(milestoneX + 9, milestoneY);
        diamondPath.lineTo(milestoneX, milestoneY + 9);
        diamondPath.lineTo(milestoneX - 9, milestoneY);
        diamondPath.closePath();

        taskGroup
          .append('path')
          .attr('d', diamondPath.toString())
          .attr('fill', task.progress >= 100 ? '#10b981' : '#f59e0b')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5)
          .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))');

        // Flag icon or star in center
        taskGroup
          .append('circle')
          .attr('cx', milestoneX)
          .attr('cy', milestoneY)
          .attr('r', 2.5)
          .attr('fill', '#ffffff');
      }

      // Progress Percentage & Variance Badge inside bar
      const labelX = actualX + Math.min(progressWidth, totalWidth) + 8;
      if (labelX + 80 < timelineWidth) {
        taskGroup
          .append('text')
          .attr('x', labelX)
          .attr('y', y + h / 2 + 3.5)
          .attr('fill', task.status === 'DELAYED' ? '#f43f5e' : '#cbd5e1')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'ui-monospace, monospace')
          .text(`${task.progress}% ${task.varianceDays < 0 ? `(${task.varianceDays}d)` : ''}`);
      }
    });

    // 5. Header Time Axis (Top)
    const headerAxisGroup = timelineG.append('g').attr('class', 'time-axis');

    // Header Background
    headerAxisGroup
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', timelineWidth)
      .attr('height', headerHeight)
      .attr('fill', '#090d16')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1);

    // Axis generation
    const formatTimeTick = (d: Date) => {
      if (timeScale === 'days') {
        return d3.timeFormat('%d %b')(d);
      }
      if (timeScale === 'weeks') {
        return `Wk ${d3.timeFormat('%d %b')(d)}`;
      }
      return d3.timeFormat('%b %y')(d);
    };

    ticks.forEach((tickDate) => {
      const x = xScale(tickDate);
      if (x >= 0 && x <= timelineWidth) {
        headerAxisGroup
          .append('line')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', headerHeight - 12)
          .attr('y2', headerHeight)
          .attr('stroke', '#475569');

        headerAxisGroup
          .append('text')
          .attr('x', x + 4)
          .attr('y', headerHeight - 16)
          .attr('fill', '#94a3b8')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .attr('font-family', 'ui-monospace, monospace')
          .text(formatTimeTick(tickDate));
      }
    });

    // 6. Left Fixed Column Labels & Stages
    const leftColumnG = svg.append('g').attr('class', 'left-column-labels');

    // Header for Left Column
    leftColumnG
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', labelColumnWidth)
      .attr('height', headerHeight)
      .attr('fill', '#090d16')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1);

    leftColumnG
      .append('text')
      .attr('x', 16)
      .attr('y', 36)
      .attr('fill', '#f59e0b')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('letter-spacing', '0.08em')
      .text('CONSTRUCTION STAGES & MILESTONES');

    tasks.forEach((task, idx) => {
      const y = yScale(task.id) || 0;
      const h = yScale.bandwidth();
      const isSelected = selectedTaskId === task.id;
      const isHovered = hoveredTaskId === task.id;

      const rowG = leftColumnG
        .append('g')
        .attr('class', 'task-label-row')
        .attr('cursor', 'pointer')
        .on('click', () => {
          setSelectedTaskId(task.id);
          if (onSelectActivity) onSelectActivity(task.id);
        })
        .on('mouseenter', (event) => {
          setHoveredTaskId(task.id);
          showTooltip(event, task);
        })
        .on('mouseleave', () => {
          setHoveredTaskId(null);
          hideTooltip();
        });

      // Background highlight on selection/hover
      if (isSelected || isHovered) {
        rowG
          .append('rect')
          .attr('x', 4)
          .attr('y', y)
          .attr('width', labelColumnWidth - 8)
          .attr('height', h)
          .attr('rx', 6)
          .attr('fill', isSelected ? '#f59e0b15' : '#1e293b40')
          .attr('stroke', isSelected ? '#f59e0b' : '#334155')
          .attr('stroke-width', isSelected ? 1.5 : 1);
      }

      // Order badge
      rowG
        .append('rect')
        .attr('x', 14)
        .attr('y', y + h / 2 - 9)
        .attr('width', 22)
        .attr('height', 18)
        .attr('rx', 4)
        .attr('fill', task.isMilestone ? '#f59e0b20' : '#1e293b')
        .attr('stroke', task.isMilestone ? '#f59e0b' : '#334155');

      rowG
        .append('text')
        .attr('x', 25)
        .attr('y', y + h / 2 + 3.5)
        .attr('text-anchor', 'middle')
        .attr('fill', task.isMilestone ? '#f59e0b' : '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'ui-monospace, monospace')
        .text(task.order);

      // Task Name
      const truncatedName =
        task.name.length > 24 ? task.name.slice(0, 23) + '…' : task.name;

      rowG
        .append('text')
        .attr('x', 44)
        .attr('y', y + h / 2 - 2)
        .attr('fill', isSelected ? '#f59e0b' : '#f8fafc')
        .attr('font-size', '11px')
        .attr('font-weight', task.isMilestone ? 'bold' : '600')
        .text(truncatedName);

      // Sub-text: Status & Duration
      rowG
        .append('text')
        .attr('x', 44)
        .attr('y', y + h / 2 + 11)
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .text(`${task.durationDays}d • ${task.status} • ${task.progress}%`);

      // Critical Path indicator icon / dot
      if (task.isCritical && highlightCriticalPath) {
        rowG
          .append('circle')
          .attr('cx', labelColumnWidth - 20)
          .attr('cy', y + h / 2)
          .attr('r', 3)
          .attr('fill', '#f43f5e')
          .attr('title', 'Critical Path Activity');
      }
    });

    // 7. Tooltip helpers
    function showTooltip(event: MouseEvent, task: ProcessedTask) {
      if (!tooltipRef.current) return;
      const tooltip = tooltipRef.current;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left + 16;
      const y = event.clientY - rect.top - 10;

      tooltip.style.left = `${Math.min(x, width - 280)}px`;
      tooltip.style.top = `${y}px`;
      tooltip.style.display = 'block';

      // HTML Content
      tooltip.innerHTML = `
        <div class="p-3 bg-slate-950/95 border border-slate-700 rounded-2xl shadow-2xl text-xs space-y-2 min-w-[240px]">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span class="font-mono text-[10px] text-amber-400 font-bold">STAGE #${task.order} ${task.isMilestone ? '• MILESTONE' : ''}</span>
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded ${
              task.status === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-400'
                : task.status === 'DELAYED'
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-amber-500/20 text-amber-400'
            }">${task.status}</span>
          </div>

          <div class="font-bold text-white text-sm">${task.name}</div>

          <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-300 font-mono">
            <div>
              <span class="text-slate-500 block">Planned Start:</span>
              ${formatDate(task.plannedStart)}
            </div>
            <div>
              <span class="text-slate-500 block">Planned Finish:</span>
              ${formatDate(task.plannedEnd)}
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-[10px] font-mono">
              <span class="text-slate-400">Physical Progress:</span>
              <span class="font-bold text-emerald-400">${task.progress}%</span>
            </div>
            <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full" style="width: ${task.progress}%"></div>
            </div>
          </div>

          ${
            task.predecessors.length > 0
              ? `<div class="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                  <span class="text-slate-500">Prerequisites / Dependencies:</span>
                  <div class="font-mono text-amber-300">${task.predecessors.length} Predecessor Stage(s)</div>
                 </div>`
              : ''
          }

          ${
            task.isCritical
              ? `<div class="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                  <span>● On Project Critical Path</span>
                 </div>`
              : ''
          }
          
          <div class="text-[9px] text-slate-500 text-center italic pt-1 border-t border-slate-800/60">
            Click stage bar to inspect activity details & logs
          </div>
        </div>
      `;
    }

    function hideTooltip() {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
    }
  }, [
    tasks,
    links,
    timeScale,
    showDependencies,
    showPlannedBaseline,
    highlightCriticalPath,
    selectedTaskId,
    hoveredTaskId,
  ]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 text-xs">
      {/* 1. Top Header & KPI Status Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              D3 Civil Engine
            </span>
            <span className="text-xs text-slate-400">• {projectName}</span>
          </div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>Construction Gantt Timeline & Dependency Engine</span>
          </h2>
          <p className="text-xs text-slate-400">
            Interactive milestone network with predecessor tracking, planned baseline vs actual execution, and critical path surveillance.
          </p>
        </div>

        {/* Quick KPI Strip */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0 font-mono">
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 block uppercase">Stages</span>
            <strong className="text-white text-xs">{stats.total}</strong>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-emerald-400 block uppercase">Done</span>
            <strong className="text-emerald-400 text-xs">{stats.completed}</strong>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-amber-400 block uppercase">In-Prog</span>
            <strong className="text-amber-400 text-xs">{stats.inProgress}</strong>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-rose-400 block uppercase">Delayed</span>
            <strong className="text-rose-400 text-xs">{stats.delayed}</strong>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-blue-400 block uppercase">Milestones</span>
            <strong className="text-blue-400 text-xs">{stats.milestones}</strong>
          </div>
        </div>
      </div>

      {/* 2. Interactive Controls & Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
        {/* Left Side: Time Scale & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Resolution buttons */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setTimeScale('days')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                timeScale === 'days' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Days
            </button>
            <button
              onClick={() => setTimeScale('weeks')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                timeScale === 'weeks' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weeks
            </button>
            <button
              onClick={() => setTimeScale('months')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                timeScale === 'months' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Months
            </button>
          </div>

          {/* Show Dependencies Toggle */}
          <button
            onClick={() => setShowDependencies((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showDependencies
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Dependencies</span>
          </button>

          {/* Planned Baseline Toggle */}
          <button
            onClick={() => setShowPlannedBaseline((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showPlannedBaseline
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Baseline Plan</span>
          </button>

          {/* Critical Path Toggle */}
          <button
            onClick={() => setHighlightCriticalPath((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              highlightCriticalPath
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Critical Path</span>
          </button>

          {/* Milestones Only Toggle */}
          <button
            onClick={() => setOnlyMilestones((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              onlyMilestones
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Milestones Only</span>
          </button>
        </div>

        {/* Right Side: Status Filter & Search */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">
                All Statuses
              </option>
              <option value="IN_PROGRESS" className="bg-slate-900 text-white">
                In Progress
              </option>
              <option value="COMPLETED" className="bg-slate-900 text-white">
                Completed
              </option>
              <option value="DELAYED" className="bg-slate-900 text-white">
                Delayed
              </option>
              <option value="SCHEDULED" className="bg-slate-900 text-white">
                Scheduled
              </option>
              <option value="NOT_STARTED" className="bg-slate-900 text-white">
                Not Started
              </option>
            </select>
          </div>

          {/* Search Stage Input */}
          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-36 sm:w-44"
          />
        </div>
      </div>

      {/* 3. D3 SVG Canvas Container with Horizontal Scroll */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto rounded-2xl border border-slate-800 bg-[#080d19] shadow-inner select-none"
      >
        <svg ref={svgRef} className="w-full font-sans block" />

        {/* Floating Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute z-50 pointer-events-none hidden transition-all duration-75"
        />
      </div>

      {/* 4. Legend & Instruction Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-300">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500" />
            <span>Delayed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rotate-45 bg-amber-400 border border-white" />
            <span>Construction Milestone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-rose-500" />
            <span>Critical Path Link</span>
          </div>
        </div>

        <div className="text-slate-500 font-mono text-[10px]">
          Hover to highlight predecessor chain • Click task bar to inspect details
        </div>
      </div>
    </div>
  );
}
