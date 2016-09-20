
export default {
  container() {
      return `<?xml version="1.0"?>
      <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
        <rootfiles>
          <rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`;
    },
    mimetype() {
      return 'application/epub+zip';
    }
};
