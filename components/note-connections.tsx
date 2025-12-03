"use client";

import { useMemo } from "react";
import {
  NoteConnection,
  StickyNote,
  CONNECTION_TYPES,
  ConnectionType,
} from "@/lib/types";
import { X } from "lucide-react";

interface NoteConnectionsProps {
  notes: StickyNote[];
  connections: NoteConnection[];
  onDeleteConnection: (connectionId: string) => void;
  onConnectionClick?: (connection: NoteConnection) => void;
  canvasWidth: number;
  canvasHeight: number;
  // For link mode preview
  linkingFrom?: string | null;
  linkingTo?: { x: number; y: number } | null;
  linkType?: ConnectionType;
}

// Note dimensions for calculating center points
const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 200;

export function NoteConnections({
  notes,
  connections,
  onDeleteConnection,
  onConnectionClick,
  canvasWidth,
  canvasHeight,
  linkingFrom,
  linkingTo,
  linkType = "relates",
}: NoteConnectionsProps) {
  // Create a map of note positions for quick lookup
  const notePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    notes.forEach((note) => {
      map.set(note.id, {
        x: note.x + NOTE_WIDTH / 2,
        y: note.y + NOTE_HEIGHT / 2,
      });
    });
    return map;
  }, [notes]);

  // Calculate the curved path between two points
  const getPath = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): string => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Curve control point offset (proportional to distance)
    const curveOffset = Math.min(distance * 0.2, 80);

    // Calculate control points for a smooth curve
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;

    // Perpendicular offset for the curve
    const perpX = (-dy / distance) * curveOffset;
    const perpY = (dx / distance) * curveOffset;

    const controlX = midX + perpX;
    const controlY = midY + perpY;

    return `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`;
  };

  // Calculate arrow head points
  const getArrowHead = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): string => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Use the same curve calculation to find the tangent at the end
    const curveOffset = Math.min(distance * 0.2, 80);
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const perpX = (-dy / distance) * curveOffset;
    const perpY = (dx / distance) * curveOffset;
    const controlX = midX + perpX;
    const controlY = midY + perpY;

    // Tangent at end point (derivative of quadratic bezier at t=1)
    const tangentX = 2 * (toX - controlX);
    const tangentY = 2 * (toY - controlY);
    const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);

    const arrowSize = 12;
    const arrowAngle = 0.5; // radians (~30 degrees)

    // Normalize tangent
    const nx = tangentX / tangentLen;
    const ny = tangentY / tangentLen;

    // Arrow head points
    const tipX = toX - nx * 5; // Pull back slightly so arrow doesn't overlap endpoint
    const tipY = toY - ny * 5;

    const leftX =
      tipX -
      arrowSize * (nx * Math.cos(arrowAngle) - ny * Math.sin(arrowAngle));
    const leftY =
      tipY -
      arrowSize * (ny * Math.cos(arrowAngle) + nx * Math.sin(arrowAngle));

    const rightX =
      tipX -
      arrowSize * (nx * Math.cos(arrowAngle) + ny * Math.sin(arrowAngle));
    const rightY =
      tipY -
      arrowSize * (ny * Math.cos(arrowAngle) - nx * Math.sin(arrowAngle));

    return `M ${leftX} ${leftY} L ${tipX} ${tipY} L ${rightX} ${rightY}`;
  };

  // Get label position (middle of the curve)
  const getLabelPosition = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): { x: number; y: number } => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curveOffset = Math.min(distance * 0.2, 80);

    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;

    const perpX = (-dy / distance) * curveOffset;
    const perpY = (dx / distance) * curveOffset;

    // Point on the bezier curve at t=0.5
    const t = 0.5;
    const bezierX =
      (1 - t) * (1 - t) * fromX +
      2 * (1 - t) * t * (midX + perpX) +
      t * t * toX;
    const bezierY =
      (1 - t) * (1 - t) * fromY +
      2 * (1 - t) * t * (midY + perpY) +
      t * t * toY;

    return { x: bezierX, y: bezierY };
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Gradient definitions for each connection type */}
        {Object.entries(CONNECTION_TYPES).map(([type, info]) => (
          <linearGradient
            key={type}
            id={`gradient-${type}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={info.color} stopOpacity="0.6" />
            <stop offset="50%" stopColor={info.color} stopOpacity="1" />
            <stop offset="100%" stopColor={info.color} stopOpacity="0.6" />
          </linearGradient>
        ))}
        {/* Glow filter for connections */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Render existing connections */}
      {connections.map((connection) => {
        const fromPos = notePositions.get(connection.fromNoteId);
        const toPos = notePositions.get(connection.toNoteId);

        if (!fromPos || !toPos) return null;

        const typeInfo = CONNECTION_TYPES[connection.type];
        const path = getPath(fromPos.x, fromPos.y, toPos.x, toPos.y);
        const arrowPath = getArrowHead(fromPos.x, fromPos.y, toPos.x, toPos.y);
        const labelPos = getLabelPosition(
          fromPos.x,
          fromPos.y,
          toPos.x,
          toPos.y
        );

        return (
          <g key={connection.id} className="group">
            {/* Invisible wider path for easier clicking */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={20}
              className="pointer-events-auto cursor-pointer"
              onClick={() => onConnectionClick?.(connection)}
            />

            {/* Visible connection line */}
            <path
              d={path}
              fill="none"
              stroke={typeInfo.color}
              strokeWidth={3}
              strokeLinecap="round"
              filter="url(#glow)"
              className="transition-all duration-200"
              style={{ opacity: 0.8 }}
            />

            {/* Arrow head */}
            <path
              d={arrowPath}
              fill="none"
              stroke={typeInfo.color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Connection type label */}
            <g
              className="pointer-events-auto cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={() => onConnectionClick?.(connection)}
            >
              <rect
                x={labelPos.x - 40}
                y={labelPos.y - 14}
                width={80}
                height={28}
                rx={14}
                fill="white"
                stroke={typeInfo.color}
                strokeWidth={2}
                className="drop-shadow-md"
              />
              <text
                x={labelPos.x}
                y={labelPos.y + 5}
                textAnchor="middle"
                className="text-xs font-bold fill-gray-700"
              >
                {typeInfo.emoji} {typeInfo.label}
              </text>
            </g>

            {/* Delete button on hover */}
            <g
              className="pointer-events-auto cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConnection(connection.id);
              }}
              transform={`translate(${labelPos.x + 45}, ${labelPos.y})`}
            >
              <circle
                r={12}
                fill="white"
                stroke="#f87171"
                strokeWidth={2}
                className="drop-shadow-sm hover:fill-red-50"
              />
              <line
                x1="-4"
                y1="-4"
                x2="4"
                y2="4"
                stroke="#f87171"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <line
                x1="4"
                y1="-4"
                x2="-4"
                y2="4"
                stroke="#f87171"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </g>
          </g>
        );
      })}

      {/* Preview line while linking */}
      {linkingFrom &&
        linkingTo &&
        (() => {
          const fromPos = notePositions.get(linkingFrom);
          if (!fromPos) return null;

          const typeInfo = CONNECTION_TYPES[linkType];
          const path = getPath(fromPos.x, fromPos.y, linkingTo.x, linkingTo.y);
          const arrowPath = getArrowHead(
            fromPos.x,
            fromPos.y,
            linkingTo.x,
            linkingTo.y
          );

          return (
            <g className="pointer-events-none">
              <path
                d={path}
                fill="none"
                stroke={typeInfo.color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="8 4"
                opacity={0.6}
              />
              <path
                d={arrowPath}
                fill="none"
                stroke={typeInfo.color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.6}
              />
            </g>
          );
        })()}
    </svg>
  );
}
