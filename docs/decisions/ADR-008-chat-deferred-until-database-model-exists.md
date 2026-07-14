# ADR-008: Chat Deferred Until Database Model Exists

## Status

Accepted

## Decision

AutiCare adopts this foundation decision for the initial production-oriented architecture.

## Consequences

The team can work in vertical slices without premature distributed-system complexity.

Future chat requires conversation, conversation_participant, message, message_attachment, and message_read_receipt entities before implementation.
