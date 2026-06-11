"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiresPermissions = exports.PERMISSIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PERMISSIONS_KEY = 'permissions';
const RequiresPermissions = (...slugs) => (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, slugs);
exports.RequiresPermissions = RequiresPermissions;
