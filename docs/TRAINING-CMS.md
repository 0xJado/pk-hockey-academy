# Training dates and venues

Local implementation only; no Studio deployment, webhook mutation or CMS activation was performed.

## Editorial workflow

Create a Trainingsstätte, enter confirmed city/details and optional rink/address, choose active or planned, review and approve before making it visible. Planned cities cannot host published sessions.

Create a Trainingstermin with timezone-aware beginning/end, group, approved active venue and open/full/cancelled status. Leave capacity blank when unknown. New records start hidden/unapproved; demo sessions cannot publish. No registration URL or universal SpielerPlus action is enabled.

Studio and website share validation. The website independently excludes drafts/releases/hidden/unapproved records, rejects malformed approved content, duplicate IDs and invalid venue references, and treats an empty CMS as authoritative. Ended sessions disappear on the next successful build (static pages do not update at midnight without a rebuild). Cancelled upcoming sessions remain labelled and unbookable.

## Later activation

Deploy Studio schemas and updated publication-hook filter through the existing documented process. Publish approved venues before sessions. Set SANITY_TRAINING_ENABLED=true on the website only after a fixture-tested release and genuine publish/edit/withdraw/restore acceptance. When enabled, CMS venues replace local cities entirely; publish every city that should remain visible. Never put registrations or private data in these records.

The build reads published content server-side with a timeout; credentials never enter client code. Failed reads fail the build rather than resurrecting local content. No live synchronization or booking confirmation is claimed.
