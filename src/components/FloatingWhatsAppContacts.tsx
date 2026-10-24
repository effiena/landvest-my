"use client";

import { useState } from "react";
import { getWhatsAppLink } from "@/lib/whatsapp";

const agents = [
  { name: "YOORI", phone: "0109688408", initials: "Y" },
  { name: "DELLA", phone: "01113204880", initials: "D" },
];

export default function FloatingWhatsAppContacts() {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <aside className="pv-contact-card" aria-label="PropVest WhatsApp contacts">
      <style>{`
        .pv-contact-card {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 1000;
          width: 292px;
          box-sizing: border-box;
          padding: 16px;
          color: #F7F5EF;
          background: linear-gradient(145deg, rgba(16,29,58,.98), rgba(8,17,37,.99));
          border: 1px solid rgba(214,183,121,.42);
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(2,8,23,.32), 0 0 22px rgba(214,183,121,.10);
          font-family: Arial, sans-serif;
          backdrop-filter: blur(18px);
          animation: pv-contact-in .25s ease-out;
        }
        .pv-contact-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .pv-contact-brand {
          margin: 0;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #D6B779;
        }
        .pv-contact-title {
          margin: 5px 0 0;
          font-size: 17px;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -.3px;
        }
        .pv-contact-subtitle {
          margin: 5px 0 0;
          color: #9FB5CC;
          font-size: 11px;
          line-height: 1.4;
        }
        .pv-contact-close {
          flex: 0 0 auto;
          width: 27px;
          height: 27px;
          border: 1px solid rgba(148,163,184,.22);
          border-radius: 8px;
          background: rgba(255,255,255,.06);
          color: #B8C9DB;
          font-size: 19px;
          cursor: pointer;
        }
        .pv-contact-label {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 14px 0 7px;
          color: #94AFC8;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .pv-contact-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34D399;
          box-shadow: 0 0 8px rgba(52,211,153,.75);
        }
        .pv-contact-agent {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 9px 0;
          border-top: 1px solid rgba(148,163,184,.14);
        }
        .pv-contact-person {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }
        .pv-contact-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          border-radius: 10px;
          border: 1px solid rgba(214,183,121,.35);
          background: linear-gradient(145deg, #145A43, #101D3A);
          color: #D6B779;
          font-size: 13px;
          font-weight: 800;
        }
        .pv-contact-name {
          color: #F0F9FF;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .8px;
        }
        .pv-contact-role {
          margin-top: 3px;
          color: #7F9AB4;
          font-size: 10px;
        }
        .pv-contact-wa {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          flex: 0 0 auto;
          padding: 8px 9px;
          border: 1px solid rgba(52,211,153,.35);
          border-radius: 8px;
          background: linear-gradient(135deg, #087F68, #059669);
          color: white;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
          transition: transform .15s ease, filter .15s ease;
        }
        .pv-contact-wa:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }
        @keyframes pv-contact-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 600px) {
          .pv-contact-card {
            right: 10px;
            bottom: 10px;
            width: 244px;
            padding: 11px 12px;
            border-radius: 13px;
            box-shadow: 0 8px 25px rgba(2,8,23,.28), 0 0 14px rgba(214,183,121,.07);
          }
          .pv-contact-title { font-size: 14px; }
          .pv-contact-subtitle { font-size: 10px; margin-top: 3px; }
          .pv-contact-label { margin: 10px 0 5px; font-size: 8px; }
          .pv-contact-agent { padding: 7px 0; }
          .pv-contact-avatar { width: 28px; height: 28px; flex-basis: 28px; border-radius: 8px; }
          .pv-contact-name { font-size: 11px; }
          .pv-contact-role { font-size: 9px; margin-top: 2px; }
          .pv-contact-wa { padding: 7px 8px; font-size: 9px; }
          .pv-contact-close { width: 24px; height: 24px; font-size: 17px; }
        }
        @media (max-width: 360px) {
          .pv-contact-card { width: 226px; right: 8px; bottom: 8px; padding: 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pv-contact-card { animation: none; }
          .pv-contact-wa { transition: none; }
        }
      `}</style>

      <div className="pv-contact-top">
        <div>
          <p className="pv-contact-brand">PROP VEST // CONNECT</p>
          <h2 className="pv-contact-title">Let’s talk property.</h2>
          <p className="pv-contact-subtitle">Connect directly with our team.</p>
        </div>
        <button
          type="button"
          className="pv-contact-close"
          onClick={() => setOpen(false)}
          aria-label="Close WhatsApp contacts"
        >
          ×
        </button>
      </div>

      <div className="pv-contact-label">
        <span className="pv-contact-dot" />
        Available agents
      </div>

      {agents.map((agent) => (
        <div className="pv-contact-agent" key={agent.name}>
          <div className="pv-contact-person">
            <span className="pv-contact-avatar" aria-hidden="true">
              {agent.initials}
            </span>
            <div>
              <div className="pv-contact-name">{agent.name}</div>
              <div className="pv-contact-role">Property consultant</div>
            </div>
          </div>
          <a
            className="pv-contact-wa"
            href={getWhatsAppLink(agent.phone)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat with ${agent.name} on WhatsApp`}
          >
            WhatsApp ↗
          </a>
        </div>
      ))}
    </aside>
  );
}
