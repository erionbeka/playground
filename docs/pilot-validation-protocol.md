# Pilot Validation Protocol Draft

This protocol draft is intended to address reviewer concerns about why a built platform does not yet have a publication or documented pilot.

## Purpose

Evaluate the feasibility, usability, safety, and workflow fit of Playground Life in a controlled clinic/family pilot before making clinical efficacy claims.

## Suggested Pilot Design

- Duration: 6 to 8 weeks.
- Participants: 3 to 5 therapists and 10 to 20 families, subject to ethics/privacy approval.
- Setting: one clinic or tightly controlled multi-clinic pilot.
- Data: consented pilot data only, stored in the Postgres production environment.
- Controls: role-based access, audit logging, security review, consent records, and issue tracking.

## Primary Evaluation Questions

- Can therapists create and manage child profiles, goals, assignments, and reviews without excessive setup burden?
- Can families understand and complete assigned sessions at home?
- Are recommendation reasons understandable and clinically useful to therapists?
- Does the system improve assignment adherence or continuity between clinic and home?
- Are there safety, privacy, accessibility, or usability issues that must be resolved before expansion?

## Measures

- Therapist task completion rate.
- Family session completion rate.
- Assignment adherence across weeks.
- Time required to create assignments and review outcomes.
- Therapist-rated usefulness of recommendations.
- Caregiver usability score.
- Number and severity of support/privacy/safety issues.
- Qualitative feedback from therapists and caregivers.

## Success Criteria

- At least 80% of assigned family sessions are completed or intentionally skipped with documented reason.
- Therapists rate recommendation explanations as understandable and useful on average.
- No unresolved high-severity privacy or safety findings remain at pilot close.
- Pilot produces enough workflow and usability evidence to support a feasibility report or publication submission.

## Publication Plan

The first publication should be framed as feasibility/usability evidence, not clinical efficacy. A later study can evaluate outcome effectiveness once feasibility, privacy, and operational controls are established.

## Grant-Safe Status Statement

The absence of a prior publication reflects the stage of evidence generation. The platform is built; the proposed pilot is the mechanism for producing documented, publishable evidence.
