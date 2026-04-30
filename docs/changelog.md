# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-04-30

### Added
- Added `fullName` and `phoneNumber` fields to `SosReportResponse` in `src/shared/entities/SosEntity.ts`.
- Display requester's name (`fullName`) in `SosDetailModal` and `AdminSosDetailModal`.
- Display requester's name in `VolunteerRequestsView` rescue request cards.
- Display requester's name in `VolunteerMapView` incident list and detail modal.
- Display requester's name in `OperationMapView` (Citizen view) incident popup.
- Added "Người yêu cầu" (Requester name) column to the SOS reports table in `AdminDashboardView`.

### Fixed
- Updated `sosService.submitSosRequest` to include `FullName` and `PhoneNumber` in the API payload.
- Fixed `useAdminDashboardViewModel.ts` to correctly map requester names by joining SOS reports with the user list.
- Removed "Tiết lộ tên ẩn danh" (Anonymous) badge from `SosFormModal.tsx` to ensure transparency as requested.
- Fixed scrolling issue in `CitizenLayout` and `VolunteerLayout` by adding `overflow-y: auto`.
- Removed inaccurate "Giờ phục vụ" (Hours of Service) from Volunteer Profile.
- Implemented real-time calculation for weekly statistics in Volunteer Profile.


