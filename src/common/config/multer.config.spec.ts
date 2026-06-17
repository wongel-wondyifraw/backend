import { imageFileFilter, IMAGE_UPLOAD_MAX_BYTES } from './multer.config';

describe('multer.config', () => {
    const callback = jest.fn();

    beforeEach(() => {
        callback.mockReset();
    });

    it('accepts valid JPEG upload', () => {
        imageFileFilter({} as Express.Request, {
            mimetype: 'image/jpeg',
            originalname: 'photo.jpg',
        } as Express.Multer.File, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('rejects invalid mime type', () => {
        imageFileFilter({} as Express.Request, {
            mimetype: 'application/pdf',
            originalname: 'doc.pdf',
        } as Express.Multer.File, callback);

        expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
    });

    it('rejects mismatched extension', () => {
        imageFileFilter({} as Express.Request, {
            mimetype: 'image/jpeg',
            originalname: 'photo.exe',
        } as Express.Multer.File, callback);

        expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
    });

    it('defines a 5MB upload limit', () => {
        expect(IMAGE_UPLOAD_MAX_BYTES).toBe(5 * 1024 * 1024);
    });
});
