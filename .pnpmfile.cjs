function readPackage(pkg, context) {
  if (process.env.INSTALL_GIT_HOSTED_PACKAGES === '1' && pkg.dependencies && pkg.dependencies['react-native-pager-view']) {
    pkg.dependencies['react-native-pager-view'] = 'github:alanhamlett/react-native-pager-view';
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
