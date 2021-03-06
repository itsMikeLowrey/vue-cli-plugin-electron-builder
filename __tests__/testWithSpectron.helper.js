const createProject = require('./createProject.helper.js')
const { copyFile, writeFile } = require('fs-extra')
const { join } = require('path')
const execa = require('execa')

module.exports = async testRunner => {
  const plugins = {}
  plugins[`@vue/cli-plugin-unit-${testRunner}`] = {}
  const { project } = await createProject(
    `spectron-${testRunner}`,
    false,
    plugins
  )
  // Remove example test
  await project.rm('tests/unit/example.spec.js')

  // Copy electron test
  await copyFile(`./generator/templates/tests-${testRunner}/tests/unit/electron.spec.js`, join(project.dir, 'tests/unit/electron.spec.js'))

  // If there is not a second test file, the `serve:electron --headless` process cannot be killed on Windows
  // One of the weirdest bugs I've ever seen
  // Without this, tests will fail on Windows
  if (testRunner === 'jest') {
    await writeFile(join(project.dir, 'tests/unit/second.spec.js'), 'test("extra", () => {})')
  }

  await execa(
    require.resolve('@vue/cli-service/bin/vue-cli-service'),
    ['test:unit'],
    {
      cwd: project.dir,
      extendEnv: false
    }
  )
}
