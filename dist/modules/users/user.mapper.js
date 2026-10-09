"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUserResponse = toUserResponse;
function toUserResponse(user, includePermissions = false) {
    var _a, _b, _c, _d;
    const roleKey = (_c = (_b = (_a = user.roleEntity) === null || _a === void 0 ? void 0 : _a.key) !== null && _b !== void 0 ? _b : user.role) !== null && _c !== void 0 ? _c : "staff";
    const dto = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        role: roleKey,
        avatar_url: user.avatar_url,
        title: user.title,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        failed_login_attempts: user.failed_login_attempts,
        locked_until: user.locked_until,
        last_login_at: user.last_login_at,
        created_via: user.created_via,
        email_verified_at: user.email_verified_at,
        mfa_enabled: user.mfa_enabled,
    };
    if (includePermissions && ((_d = user.roleEntity) === null || _d === void 0 ? void 0 : _d.permissions)) {
        dto.permissions = user.roleEntity.permissions.map((p) => ({
            slug: p.slug,
            name: p.name,
            category: p.category,
        }));
    }
    return dto;
}
