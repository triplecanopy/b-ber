module.exports = `# ==============================================================================
# Project Metadata
# Please see http://dublincore.org/documents/dcmi-terms/ for information on terms
# and usage. Additional metadata can be entered and parsed if following the
# formatting below.
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# Title and Description
# ------------------------------------------------------------------------------

- term: title
  value: Project Title
  refines:
    - title-type: main

- term: description
  value: Project description.

- term: abstract
  value: Abstract.

# ------------------------------------------------------------------------------
# Contributors
# ------------------------------------------------------------------------------

- term: creator
  value: Last Name, First Name
  refines:
    - role: aut

- term: contributor
  value: b-ber
  refines:
    - role: mrk

# ------------------------------------------------------------------------------
# Collaborators (editors, developers, designers, researchers, etc.)
# ------------------------------------------------------------------------------

- term: contributor
  value: Last Name, First Name
  refines:
    - role: edt

- term: contributor
  value: Last Name, First Name
  refines:
    - role: drt

- term: contributor
  value: Last Name, First Name
  refines:
    - role: ard

- term: contributor
  value: Last Name, First Name
  refines:
    - role: pmn

- term: contributor
  value: Last Name, First Name
  refines:
    - role: prg

- term: contributor
  value: Last Name, First Name
  refines:
    - role: dsr

- term: contributor
  value: Last Name, First Name
  refines:
    - role: mrk

- term: contributor
  value: Last Name, First Name
  refines:
    - role: rtm

# ------------------------------------------------------------------------------
# Publication Information
# ------------------------------------------------------------------------------

- term: language
  value: en-US

- term: rights
  value: © YYYY

- term: format
  value: epub+zip

- term: date
  value: YYYY-MM-DD

- term: publisher
  value: Publisher

- term: tableOfContents
  value: Chapter One; Chapter Two; etc.

# ------------------------------------------------------------------------------
# Additional Metadata
# ------------------------------------------------------------------------------

- term: temporal
  value: time

- term: spatial
  value: Project Title Location

- term: subject
  value: Project Title Subject

# ------------------------------------------------------------------------------
# Cover and Book ID (UUID, ISBN, ISSN, ASIN, etc.)
# ------------------------------------------------------------------------------

- term: identifier
  value: %IDENTIFIER%

`
